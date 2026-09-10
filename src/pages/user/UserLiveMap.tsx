import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Layers, X, Search, Crosshair, Route as RouteIcon, Loader2, MapPinOff } from 'lucide-react';
import { useStore } from '../../api/store';
import { SEVERITY_META, HAZARD_TYPE_META, timeAgo } from '../../utils/severity';
import type { Hazard, Severity } from '../../types';
import { PageHeader, SeverityChip } from '../../components/common';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchPlaces, getDirections, type Place, type Directions as DirectionsResult } from '../../api/geoServices';

/**
 * User live map — clean 2D navigation experience:
 *  • real device location (with graceful fallback, honestly labelled)
 *  • location search (Nominatim) with results list
 *  • real driving directions (OSRM) from current location to any destination
 *  • hazard markers with clustering, driveability-colored roads, layer toggles
 * All services are free/key-less; if unreachable, UI degrades gracefully.
 */

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
    else if (points.length === 1) map.setView(points[0], 15, { animate: true });
  }, [points, map]);
  return null;
}

function RecenterOn({ point }: { point: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(point, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [point, map]);
  return null;
}

export default function UserLiveMap() {
  const { api } = useStore();
  const navigate = useNavigate();
  const hazards = api.getHazards().filter((h) => !['repaired', 'verified', 'verification_pending'].includes(h.status));
  const segments = api.getSegments();
  const [selected, setSelected] = useState<Hazard | null>(null);
  const [layerOpen, setLayerOpen] = useState(false);
  const [layers, setLayers] = useState({ critical: true, high: true, moderate: true, low: true, roads: true });

  // location
  const { fix, status: geoStatus, start: startGeo } = useGeolocation(false);
  const [center, setCenter] = useState<[number, number]>([28.4765, 77.0765]);

  // search
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [dest, setDest] = useState<Place | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // directions
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState('');
  const routeIdRef = useRef(0);

  const visible = useMemo(() => hazards.filter((h) => layers[h.severity as Severity]), [hazards, layers]);
  const clusters = useMemo(() => {
    const map = new Map<string, Hazard[]>();
    for (const h of visible) {
      const key = `${Math.round(h.latitude * 400)},${Math.round(h.longitude * 400)}`;
      map.set(key, [...(map.get(key) ?? []), h]);
    }
    return [...map.values()];
  }, [visible]);

  const doSearch = async () => {
    if (!q.trim()) return;
    setSearching(true);
    setResults(await searchPlaces(q, { lat: center[0], lng: center[1] }));
    setSearching(false);
  };

  const chooseDest = (p: Place) => {
    setDest(p);
    setSearchOpen(false);
    setResults([]);
    setQ(p.name);
    runDirections(p);
    setCenter([p.lat, p.lng]);
  };

  const runDirections = async (p: Place) => {
    const from = fix ?? { lat: center[0], lng: center[1] };
    const id = ++routeIdRef.current;
    setRouting(true);
    setRouteError('');
    setRoute(null);
    const r = await getDirections(from, { lat: p.lat, lng: p.lng });
    if (id !== routeIdRef.current) return; // stale
    setRouting(false);
    if (r) setRoute(r);
    else setRouteError('Routing service unavailable — showing straight-line estimate.');
  };

  const routeLine: [number, number][] = route?.polyline ?? (dest ? [[fix?.lat ?? center[0], fix?.lng ?? center[1]], [dest.lat, dest.lng]] : []);

  // hazards near the chosen route (within 300m of any polyline point)
  const routeHazards = useMemo(() => {
    if (!routeLine.length) return [];
    return hazards.filter((h) =>
      routeLine.some((pt) => Math.hypot((h.latitude - pt[0]) * 111320, (h.longitude - pt[1]) * 101000) < 300),
    );
  }, [routeLine, hazards]);

  return (
    <div className="space-y-3">
      <PageHeader title="Live Map" sub="Road conditions, search & directions" />

      {/* search + locate bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search a destination…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            aria-label="Search destination"
          />
          {searching && (
            <div className="absolute left-9 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden /></div>
          )}
          {searchOpen && results.length > 0 && (
            <div className="card absolute z-20 mt-1.5 max-h-64 w-full overflow-auto p-1 shadow-raised">
              {results.map((p, i) => (
                <button
                  key={i}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => chooseDest(p)}
                >
                  <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{p.name}</span>
                    {p.detail && <span className="block text-xs text-gray-400">{p.detail}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn-secondary shrink-0 !px-3"
          onClick={startGeo}
          title="Use my current location"
          aria-label="Use my current location"
        >
          <Crosshair className="h-4.5 w-4.5 text-primary-600" aria-hidden />
        </button>
      </div>

      {/* location status */}
      {fix && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${fix.source === 'device' ? 'bg-green-500/10 text-green-300' : 'bg-amber-500/10 text-amber-300'}`}>
          <span className={`h-2 w-2 rounded-full ${fix.source === 'device' ? 'bg-green-500' : 'bg-amber-500'}`} aria-hidden />
          {fix.source === 'device'
            ? `Your live location${fix.accuracy ? ` (±${Math.round(fix.accuracy)} m)` : ''} — GPS active`
            : 'Location unavailable — showing Gurugram demo area. Tap the crosshair to allow location access.'}
          {geoStatus === 'denied' && <span className="font-semibold"> (permission denied)</span>}
        </div>
      )}

      {/* route banner */}
      {dest && (
        <div className="card card-pad flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="label-xs">Directions to</div>
            <div className="truncate text-sm font-bold text-ink">{dest.name}</div>
            {routing && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Finding route…</div>}
            {!routing && route && (
              <div className="text-xs text-gray-400">
                {route.durationMin} min · {route.distanceKm} km
                {routeHazards.length > 0 && <span className="ml-2 font-semibold text-orange-400">{routeHazards.length} hazard{routeHazards.length > 1 ? 's' : ''} along route</span>}
                <span className="ml-2 text-gray-400">(live OSRM route)</span>
              </div>
            )}
            {!routing && !route && routeError && <div className="text-xs text-orange-400">{routeError}</div>}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => runDirections(dest)} disabled={routing}>
              <RouteIcon className="h-3.5 w-3.5" aria-hidden /> Refresh
            </button>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => { setDest(null); setRoute(null); setQ(''); }}>
              <X className="h-3.5 w-3.5" aria-hidden /> Clear
            </button>
          </div>
        </div>
      )}

      {/* map */}
      <div className="relative overflow-hidden rounded-xl border border-line">
        <MapContainer center={center} zoom={13} zoomControl={false} className="h-[calc(100vh-360px)] min-h-[400px] w-full sm:h-[540px]">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            attribution="&copy; OpenStreetMap contributors"
          />
          <ZoomControl position="bottomright" />
          <FitBounds points={dest && routeLine.length > 1 ? routeLine.slice(0, -1).concat([[dest.lat, dest.lng]]) : []} />
          {dest && !route && <RecenterOn point={[dest.lat, dest.lng]} />}

          {/* directions route */}
          {routeLine.length > 1 && (
            <Polyline positions={routeLine} pathOptions={{ color: '#5B84FF', weight: 5, opacity: 0.9 }} />
          )}

          {/* road driveability */}
          {layers.roads && segments.map((seg) => (
            <Polyline
              key={seg.id}
              positions={seg.polyline}
              pathOptions={{
                color: seg.driveabilityScore >= 85 ? '#22C55E' : seg.driveabilityScore >= 65 ? '#EAB308' : seg.driveabilityScore >= 45 ? '#F97316' : '#EF4444',
                weight: 4,
                opacity: 0.75,
              }}
              eventHandlers={{ click: () => navigate(`/app/routes?segment=${seg.id}`) }}
            />
          ))}

          {/* hazards */}
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
              />
            );
          })}

          {/* destination marker */}
          {dest && (
            <Marker
              position={[dest.lat, dest.lng]}
              icon={L.divIcon({ className: '', html: `<div style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#5B84FF;border:2px solid #fff;box-shadow:0 2px 8px rgba(16,24,40,.4)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div>`, iconSize: [28, 28], iconAnchor: [14, 14] })}
            />
          )}

          {/* current location */}
          {fix && (
            <CircleMarker
              center={[fix.lat, fix.lng]}
              radius={7}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#5B84FF', fillOpacity: 1 }}
              aria-label="Your current location"
            >
              <Circle center={[fix.lat, fix.lng]} radius={fix.accuracy ?? 60} pathOptions={{ color: '#5B84FF', weight: 1, fillOpacity: 0.08 }} />
            </CircleMarker>
          )}
        </MapContainer>

        {/* layer control */}
        <div className="absolute right-3 top-3 z-[5]">
          <button className="card grid h-9 w-9 place-items-center shadow-card" aria-label="Map layers" aria-expanded={layerOpen} onClick={() => setLayerOpen((o) => !o)}>
            <Layers className="h-4.5 w-4.5 text-gray-400" />
          </button>
          {layerOpen && (
            <div className="card card-pad absolute right-0 z-10 mt-2 w-52 space-y-1.5">
              {([['critical', 'Critical hazards'], ['high', 'High hazards'], ['moderate', 'Moderate hazards'], ['low', 'Low hazards'], ['roads', 'Road driveability']] as const).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-300">
                  <input type="checkbox" checked={layers[key]} onChange={(e) => setLayers((l) => ({ ...l, [key]: e.target.checked }))} className="h-3.5 w-3.5 accent-primary-600" />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* legend */}
        <div className="card absolute bottom-3 left-3 z-[5] flex flex-wrap items-center gap-2.5 px-3 py-2 text-[10px] font-semibold text-gray-400 shadow-card">
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.critical.hex }} />Critical</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.high.hex }} />High</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.moderate.hex }} />Moderate</span>
          <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_META.low.hex }} />Low</span>
          {fix && <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#5B84FF' }} />You</span>}
        </div>
      </div>

      {/* route hazards strip */}
      {route && routeHazards.length > 0 && (
        <div className="card card-pad">
          <div className="label-xs mb-2">Hazards along your route</div>
          <div className="rd-scroll flex gap-2 overflow-x-auto">
            {routeHazards.slice(0, 8).map((h) => (
              <button key={h.id} className="flex min-w-max flex-col gap-1 rounded-lg border border-line px-3 py-2 text-left hover:border-primary-500/40" onClick={() => setSelected(h)}>
                <span className="text-xs font-bold text-ink">{HAZARD_TYPE_META[h.type].label}</span>
                <span className="text-[10px] text-gray-400">{h.roadName} · {timeAgo(h.lastDetected)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* hazard bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label="Hazard details">
          <div className="w-full max-w-md rounded-t-2xl bg-card p-4 shadow-raised sm:rounded-2xl">
            <div className="mb-2 flex items-start justify-between">
              <SeverityChip severity={selected.severity} size="md" />
              <button className="text-gray-400 hover:text-gray-400" aria-label="Close" onClick={() => setSelected(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-ink">{HAZARD_TYPE_META[selected.type].label}</h3>
            <p className="text-sm text-gray-400">{selected.roadName}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Risk score</dt><dd className="font-bold">{selected.riskScore}/100</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Confirmed by</dt><dd className="font-semibold">{selected.confirmationCount} vehicles</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Last detected</dt><dd>{timeAgo(selected.lastDetected)}</dd></div>
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
