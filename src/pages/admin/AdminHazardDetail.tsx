import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Wrench, MapPin, Users, ThumbsUp, ArrowLeft } from 'lucide-react';
import { useStore } from '../../api/store';
import { SeverityChip, StatusChip, ConfidenceBar, EmptyState } from '../../components/common';
import { CesiumMap } from '../../components/maps/CesiumMap';
import { HAZARD_TYPE_META, fmtDateTime, fmtTime, timeAgo } from '../../utils/severity';
import { evidenceUrl } from '../../data/evidence';
import type { VehicleType } from '../../types';

/**
 * Admin hazard detail — evidence, confidence, confirmations, location,
 * severity + repair workflow entry (spec §26).
 */
export default function AdminHazardDetail() {
  const { api } = useStore();
  const [params] = useSearchParams();
  const id = params.get('id') ?? 'PH-1024';
  const h = api.getHazardById(id);
  const [assigning, setAssigning] = useState(false);
  const [department, setDepartment] = useState('Road Maintenance Division');
  const [assigned, setAssigned] = useState(false);

  const repairs = api.getRepairs().filter((r) => r.hazardId === id);

  const riskByClass = useMemo(() => {
    const classes: VehicleType[] = ['motorcycle', 'scooter', 'sedan', 'suv'];
    const mult: Record<string, number> = { motorcycle: 1.18, scooter: 1.22, sedan: 1.0, suv: 0.68 };
    return classes.map((c) => ({ type: c, risk: Math.min(99, Math.round((h?.riskScore ?? 0) * mult[c])) }));
  }, [h]);

  if (!h) {
    return (
      <EmptyState
        title="Hazard not found"
        body="This hazard may have been removed or the link is invalid."
        action={<Link className="btn-secondary" to="/admin/hazards">Back to hazard table</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {h.id} · {HAZARD_TYPE_META[h.type].label}
          </h1>
          <p className="text-sm text-gray-400">{h.roadName} · first detected {fmtDateTime(h.firstDetected)}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityChip severity={h.severity} size="md" />
          <StatusChip status={h.status} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* left column */}
        <div className="space-y-4">
          {/* evidence */}
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              Evidence frame
            </div>
            <img
              src={h.evidenceImage ?? evidenceUrl(h.type, h.severity, h.id)}
              alt={`AI evidence frame for ${h.id}`}
              className="w-full object-cover"
            />
            <div className="card-pad flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              <span>Estimated severity: <b className="text-ink capitalize">{h.severity}</b></span>
              <span>Risk score: <b className="text-ink">{h.riskScore}/100</b></span>
              <span>AI confidence: <b className="text-ink">{h.confidence}%</b></span>
              <span>Affected width: <b className="text-ink">~{h.affectedWidthM ?? '—'} m</b></span>
            </div>
          </section>

          {/* confirmation timeline */}
          <section className="card card-pad">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Users className="h-4 w-4" aria-hidden /> Independent confirmations ({h.confirmationCount})
            </h3>
            <ol className="relative space-y-3 border-l-2 border-line pl-4">
              {h.observations.slice(-7).reverse().map((o, i) => (
                <li key={i} className="text-xs">
                  <span className="absolute -left-[5px] mt-1 h-2 w-2 rounded-full bg-primary-500/150" />
                  <div className="font-semibold text-gray-300">
                    {fmtTime(o.detectedAt)} — {o.vehicleId} {o.matched ? 'confirmed' : 'first detection'}
                  </div>
                  <div className="text-gray-400">{timeAgo(o.detectedAt)}</div>
                </li>
              ))}
            </ol>
            <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-gray-400">
              Observations are anonymous — vehicle IDs only, no personal information.
            </div>
          </section>

          {/* 3D location */}
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              Spatial context
            </div>
            <CesiumMap hazards={[h]} height={320} compact focusHazardId={h.id} />
          </section>
        </div>

        {/* right column */}
        <div className="space-y-4">
          <section className="card card-pad space-y-4">
            <ConfidenceBar value={h.confidence} />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-400">Location</dt><dd className="font-semibold">{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</dd></div>
              <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-400">Last detected</dt><dd className="font-semibold">{timeAgo(h.lastDetected)}</dd></div>
              <div className="flex justify-between border-b border-gray-50 pb-2"><dt className="text-gray-400">Status</dt><dd><StatusChip status={h.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Road</dt><dd className="flex items-center gap-1 font-semibold"><MapPin className="h-3.5 w-3.5 text-gray-400" aria-hidden /> {h.roadName}</dd></div>
            </dl>
          </section>

          {/* vehicle risk */}
          <section className="card card-pad">
            <h3 className="mb-3 text-sm font-bold text-ink">Risk by vehicle class</h3>
            <div className="space-y-2">
              {riskByClass.map((r) => (
                <div key={r.type} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-semibold text-gray-300 capitalize">{r.type}</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full" style={{ width: `${r.risk}%`, background: r.risk >= 75 ? '#EF4444' : r.risk >= 50 ? '#F97316' : '#22C55E' }} />
                  </div>
                  <span className="w-10 text-right text-xs font-bold">{r.risk}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Estimated risk scores — not guarantees.</p>
          </section>

          {/* repair workflow entry */}
          <section className="card card-pad">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Wrench className="h-4 w-4" aria-hidden /> Repair workflow
            </h3>
            {repairs.length > 0 ? (
              <div className="space-y-2">
                {repairs.map((r) => (
                  <Link key={r.id} to={`/admin/repairs?id=${r.id}`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 hover:border-primary-500/40">
                    <span className="text-sm font-semibold text-ink">{r.id}</span>
                    <StatusChip status={r.status} />
                  </Link>
                ))}
              </div>
            ) : assigning || assigned ? (
              <div className="space-y-2">
                <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
                  <option>Road Maintenance Division</option>
                  <option>Drainage Cell</option>
                  <option>NHAI Coordination</option>
                </select>
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    api.createRepair(h.id, department);
                    setAssigned(true);
                    setAssigning(false);
                  }}
                >
                  Assign {h.id} to {department}
                </button>
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={() => setAssigning(true)} disabled={h.status === 'provisional'}>
                <Wrench className="h-4 w-4" aria-hidden /> Create repair case
              </button>
            )}
            {h.status === 'provisional' && (
              <p className="mt-2 text-[11px] text-gray-400">Needs 3+ independent confirmations before assignment.</p>
            )}
          </section>

          <section className="card card-pad">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <ThumbsUp className="h-4 w-4" aria-hidden /> Validation ladder
            </h3>
            <ol className="space-y-1.5 text-xs text-gray-400">
              <li className={h.confirmationCount >= 1 ? 'text-ink' : ''}>1 detection → Provisional {h.confirmationCount >= 1 && '✓'}</li>
              <li className={h.confirmationCount >= 3 ? 'text-ink' : ''}>3 detections → Confirmed {h.confirmationCount >= 3 && '✓'}</li>
              <li className={h.confirmationCount >= 7 ? 'text-ink' : ''}>7 detections → High confidence {h.confirmationCount >= 7 && '✓'}</li>
            </ol>
            <button className="btn-secondary mt-3 w-full !text-xs" onClick={() => api.confirmHazard(h.id, 'Vehicle #H88')}>
              Add independent confirmation (simulated)
            </button>
          </section>

          <Link className="btn-ghost flex w-full !text-xs" to="/admin/hazards">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to hazard table
          </Link>
        </div>
      </div>
    </div>
  );
}
