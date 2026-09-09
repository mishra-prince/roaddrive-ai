import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Navigation, Layers, X } from 'lucide-react';
import { useStore } from '../../api/store';
import { SEVERITY_META, HAZARD_TYPE_META, timeAgo } from '../../utils/severity';
import type { Hazard, Severity } from '../../types';
import { HOME } from '../../data/geoBase';
import { PageHeader, SeverityChip } from '../../components/common';

/**
 * User live map — clean 2D navigation experience (Leaflet + OSM, no API key).
 * Hazards cluster by simple grid bucketing to keep the map readable.
 */
export default function UserLiveMap() {
  const { api } = useStore();
  const navigate = useNavigate();
  const hazards = api.getHazards().filter((h) => !['repaired', 'verified', 'verification_pending'].includes(h.status));
  const segments = api.getSegments();
  const [selected, setSelected] = useState<Hazard | null>(null);
  const [layerOpen, setLayerOpen] = useState(false);
  const [layers, setLayers] = useState({
    critical: true,
    high: true,
    moderate: true,
    low: true,
    roads: true,
    route: false,
  });

  const visible = useMemo(
    () => hazards.filter((h) => layers[h.severity as Severity]),
    [hazards, layers],
  );

  // simple grid clustering (~250m cells)
  const clusters = useMemo(() => {
    const map = new Map<string, Hazard[]>();
    for (const h of visible) {
      const key = `${Math.round(h.latitude * 400)},${Math.round(h.longitude * 400)}`;
      map.set(key, [...(map.get(key) ?? []), h]);
    }
    return [...map.values()];
  }, [visible]);

  const routePoly = api.getRoutes().find((r) => r.id === 'recommended')!.polyline;

  return (
    <div className="space-y-3">
      <PageHeader title="Live Map" sub="Road conditions around you" />
      <div className="relative overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={HOME}
          zoom={13}
          className="h-[calc(100vh-320px)] min-h-[380px] w-full sm:h-[520px]"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          {layers.route && (
            <Polyline positions={routePoly} pathOptions={{ color: '#2557E7', weight: 5, opacity: 0.85 }} />
          )}
          {layers.roads &&
            segments.map((seg) => (
              <Polyline
                key={seg.id}
                positions={seg.polyline}
                pathOptions={{
                  color:
                    seg.driveabilityScore >= 85 ? '#16A34A'
                    : seg.driveabilityScore >= 65 ? '#CA8A04'
                    : seg.driveabilityScore >= 45 ? '#EA580C'
                    : '#DC2626',
                  weight: 4,
                  opacity: 0.75,
                }}
                eventHandlers={{ click: () => navigate(`/app/routes?segment=${seg.id}`) }}
              />
            ))}
          {clusters.map((group) => {
            if (group.length === 1) {
              const h = group[0];
              return (
                <CircleMarker
                  key={h.id}
                  center={[h.latitude, h.longitude]}
                  radius={9}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: SEVERITY_META[h.severity].hex, fillOpacity: 1 }}
                  eventHandlers={{ click: () => setSelected(h) }}
                  aria-label={`${HAZARD_TYPE_META[h.type].label}, ${SEVERITY_META[h.severity].label} severity`}
                />
              );
            }
            const lat = group.reduce((s, h) => s + h.latitude, 0) / group.length;
            const lng = group.reduce((s, h) => s + h.longitude, 0) / group.length;
            const worst = group.reduce<Hazard>(
              (a, b) => (a.severity === 'critical' ? a : b.severity === 'critical' || b.riskScore > a.riskScore ? b : a),
              group[0],
            );
            return (
              <CircleMarker
                key={`${lat},${lng}`}
                center={[lat, lng]}
                radius={13}
                pathOptions={{ color: '#fff', weight: 2.5, fillColor: SEVERITY_META[worst.severity].hex, fillOpacity: 0.95 }}
                eventHandlers={{ click: () => setSelected(worst) }}
              >
                <span>{group.length}</span>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* layer control */}
        <div className="absolute right-3 top-3 z-10">
          <button
            className="card grid h-9 w-9 place-items-center shadow-card"
            aria-label="Map layers"
            aria-expanded={layerOpen}
            onClick={() => setLayerOpen((o) => !o)}
          >
            <Layers className="h-4.5 w-4.5 text-gray-600" />
          </button>
          {layerOpen && (
            <div className="card card-pad absolute right-0 mt-2 w-52 space-y-1.5">
              {(
                [
                  ['critical', 'Critical hazards'],
                  ['high', 'High hazards'],
                  ['moderate', 'Moderate hazards'],
                  ['low', 'Low hazards'],
                  ['roads', 'Road driveability'],
                  ['route', 'Recommended route'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={(e) => setLayers((l) => ({ ...l, [key]: e.target.checked }))}
                    className="h-3.5 w-3.5 accent-primary-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* legend */}
        <div className="card absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-2 text-[10px] font-semibold text-gray-600 shadow-card">
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.critical.hex }} />Critical</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.high.hex }} />High</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.moderate.hex }} />Moderate</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.low.hex }} />Low</span>
        </div>

        <div className="card absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-card">
          <Navigation className="h-3.5 w-3.5 text-primary-600" aria-hidden />
          You are here
        </div>
      </div>

      {/* bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 sm:items-center" role="dialog" aria-modal="true" aria-label="Hazard details">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-raised sm:rounded-2xl">
            <div className="mb-2 flex items-start justify-between">
              <SeverityChip severity={selected.severity} size="md" />
              <button className="text-gray-400 hover:text-gray-600" aria-label="Close" onClick={() => setSelected(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-ink">{HAZARD_TYPE_META[selected.type].label}</h3>
            <p className="text-sm text-gray-500">{selected.roadName}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Risk score</dt><dd className="font-bold">{selected.riskScore}/100</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Confirmed by</dt><dd className="font-semibold">{selected.confirmationCount} vehicles</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Last detected</dt><dd>{timeAgo(selected.lastDetected)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">First detected</dt><dd>{timeAgo(selected.firstDetected)}</dd></div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => navigate(`/app/hazard/${selected.id}`)}>View Evidence</button>
              <button className="btn-primary" onClick={() => { api.confirmHazard(selected.id); setSelected(null); }}>Report / Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
