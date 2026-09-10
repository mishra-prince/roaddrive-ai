import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CesiumMap } from '../../components/maps/CesiumMap';
import { useStore } from '../../api/store';
import { PageHeader, SeverityChip, StatusChip, ConfidenceBar } from '../../components/common';
import { HAZARD_TYPE_META, timeAgo, cn } from '../../utils/severity';
import type { Severity } from '../../types';
import { evidenceUrl } from '../../data/evidence';

const SEVS: (Severity | 'all')[] = ['all', 'critical', 'high', 'moderate', 'low'];
const STATUSES = ['all', 'new', 'verified', 'assigned', 'under_repair', 'repaired', 'verification_failed'] as const;

export default function AdminLiveMap() {
  const { api } = useStore();
  const [params] = useSearchParams();
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [search, setSearch] = useState('');
  const [focusId, setFocusId] = useState<string | null>(params.get('id'));
  const [layers, setLayers] = useState({
    hazards: true,
    clusters: true,
    roads: true,
    repairs: true,
    observations: true,
  });
  const [selected, setSelected] = useState<string | null>(params.get('id'));

  const hazards = api.getHazards();
  const repairs = api.getRepairs();

  const visible = useMemo(() => {
    let rows = hazards;
    if (sev !== 'all') rows = rows.filter((h) => h.severity === sev);
    if (status !== 'all') {
      rows = rows.filter((h) =>
        status === 'new' ? h.status === 'provisional' : h.status === status,
      );
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((h) => `${h.id} ${h.roadName}`.toLowerCase().includes(q));
    }
    return rows;
  }, [hazards, sev, status, search]);

  const selectedHazard = hazards.find((h) => h.id === selected);

  return (
    <div className="space-y-4">
      <PageHeader title="Live 3D Map" sub="Spatial intelligence · God's-eye view" />

      {/* filters */}
      <section className="card card-pad flex flex-wrap items-center gap-3">
        <input
          className="input max-w-56"
          placeholder="Search hazard or road…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search hazards"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Severity filter">
          {SEVS.map((s) => (
            <button
              key={s}
              className={cn('chip', sev === s ? 'border-ink bg-primary-600 text-white' : 'border-line bg-card text-gray-400 hover:border-line')}
              onClick={() => setSev(s)}
              aria-pressed={sev === s}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status filter">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={cn('chip', status === s ? 'border-ink bg-primary-600 text-white' : 'border-line bg-card text-gray-400 hover:border-line')}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
            >
              {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-1.5 font-medium text-gray-400">
              <input type="checkbox" className="h-3.5 w-3.5 accent-primary-600" checked={layers[k]} onChange={(e) => setLayers((l) => ({ ...l, [k]: e.target.checked }))} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </label>
          ))}
        </div>
      </section>

      {/* map + detail rail */}
      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden p-0">
          <CesiumMap
            hazards={layers.hazards ? visible : []}
            height={600}
            focusHazardId={focusId}
            onSelect={(h) => setSelected(h.id)}
          />
        </div>

        <aside className="space-y-4" aria-label="Hazard details">
          {selectedHazard ? (
            <div className="card overflow-hidden">
              <img
                src={selectedHazard.evidenceImage ?? evidenceUrl(selectedHazard.type, selectedHazard.severity, selectedHazard.id)}
                alt={`Evidence for ${selectedHazard.id}`}
                className="h-40 w-full object-cover"
              />
              <div className="card-pad space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-ink">{selectedHazard.id}</h3>
                  <SeverityChip severity={selectedHazard.severity} />
                </div>
                <div className="text-sm text-gray-400">
                  {HAZARD_TYPE_META[selectedHazard.type].label} · {selectedHazard.roadName}
                </div>
                <StatusChip status={selectedHazard.status} />
                <ConfidenceBar value={selectedHazard.confidence} />
                <dl className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between"><dt>Confirmations</dt><dd className="font-bold text-ink">{selectedHazard.confirmationCount}</dd></div>
                  <div className="flex justify-between"><dt>Risk score</dt><dd className="font-bold text-ink">{selectedHazard.riskScore}/100</dd></div>
                  <div className="flex justify-between"><dt>Last detected</dt><dd>{timeAgo(selectedHazard.lastDetected)}</dd></div>
                </dl>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary !text-xs" onClick={() => setFocusId(selectedHazard.id)}>
                    Fly to hazard
                  </button>
                  <Link className="btn-primary !text-xs" to={`/admin/hazards?id=${selectedHazard.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-pad text-sm text-gray-400">
              Select a hazard marker on the map to inspect it. Click “Fly to hazard” to focus the 3D camera.
            </div>
          )}

          <div className="card card-pad">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Repair overlay</h4>
            {repairs.length === 0 ? (
              <p className="text-xs text-gray-400">No repair cases.</p>
            ) : (
              <ul className="space-y-2">
                {repairs.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ink">{r.id} → {r.hazardId}</span>
                    <StatusChip status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
