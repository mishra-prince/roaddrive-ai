import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ThumbsUp, Clock } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader, SeverityChip, StatusChip, EmptyState } from '../../components/common';
import { HAZARD_TYPE_META, timeAgo } from '../../utils/severity';

/**
 * Verification queue — provisional hazards awaiting crowd confirmation,
 * plus repaired hazards awaiting AI verification (spec §24, §29).
 */
export default function VerificationQueue() {
  const { api } = useStore();
  const [tab, setTab] = useState<'provisional' | 'repair'>('provisional');

  const provisional = api
    .getHazards()
    .filter((h) => h.status === 'provisional')
    .sort((a, b) => +new Date(b.lastDetected) - +new Date(a.lastDetected));
  const repairPending = api.getRepairs().filter((r) => r.status === 'verification_pending');
  const failed = api.getRepairs().filter((r) => r.status === 'failed');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Verification"
        sub="Crowd-confirm provisional hazards · verify completed repairs"
      />

      {/* tabs */}
      <div className="flex gap-1.5" role="tablist" aria-label="Verification queues">
        <button
          role="tab"
          aria-selected={tab === 'provisional'}
          className={`chip px-4 py-2 ${tab === 'provisional' ? 'border-ink bg-primary-600 text-white' : 'border-line bg-card text-gray-400'}`}
          onClick={() => setTab('provisional')}
        >
          Hazard verification ({provisional.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === 'repair'}
          className={`chip px-4 py-2 ${tab === 'repair' ? 'border-ink bg-primary-600 text-white' : 'border-line bg-card text-gray-400'}`}
          onClick={() => setTab('repair')}
        >
          Repair verification ({repairPending.length + failed.length})
        </button>
      </div>

      {tab === 'provisional' ? (
        provisional.length === 0 ? (
          <EmptyState title="No hazards awaiting verification" body="Road conditions currently look clear — every detected hazard has been crowd-confirmed." />
        ) : (
          <section className="card divide-y divide-line">
            {provisional.map((h) => (
              <article key={h.id} className="card-pad flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{h.id}</span>
                    <SeverityChip severity={h.severity} />
                    <span className="text-xs text-gray-400">{HAZARD_TYPE_META[h.type].label} · {h.roadName}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> detected {timeAgo(h.firstDetected)}</span>
                    <span>confidence {h.confidence}%</span>
                    <span>{h.confirmationCount} independent detection{h.confirmationCount === 1 ? '' : 's'}</span>
                    <span className="font-semibold text-purple-300">needs {Math.max(0, 3 - h.confirmationCount)} more to confirm</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary !py-1.5 !text-xs" onClick={() => api.confirmHazard(h.id, 'Vehicle #H88')}>
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden /> Simulate confirmation
                  </button>
                  <Link className="btn-ghost !py-1.5 !text-xs" to={`/admin/hazards?id=${h.id}`}>View</Link>
                </div>
              </article>
            ))}
          </section>
        )
      ) : (
        <div className="space-y-4">
          {repairPending.length === 0 && failed.length === 0 ? (
            <EmptyState title="No repairs awaiting verification" body="Completed repairs appear here for independent AI verification." />
          ) : (
            <>
              {repairPending.map((r) => {
                const h = api.getHazardById(r.hazardId);
                return (
                  <article key={r.id} className="card card-pad">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{r.id}</span>
                        <StatusChip status={r.status} />
                        <span className="text-xs text-gray-400">{h ? `${h.id} · ${h.roadName}` : r.hazardId}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary !py-1.5 !text-xs" onClick={() => api.simulateVerification(r.id, 'success')}>
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Simulate successful verification
                        </button>
                        <button className="btn-secondary !py-1.5 !text-xs" onClick={() => api.simulateVerification(r.id, 'failure')}>
                          Simulate failure
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Authority marked repaired {r.repairedAt ? timeAgo(r.repairedAt) : 'recently'} — awaiting independent vehicle passes.
                    </p>
                  </article>
                );
              })}
              {failed.map((r) => (
                <article key={r.id} className="card card-pad border-l-4 border-l-red-500">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{r.id}</span>
                      <StatusChip status={r.status} />
                      <span className="text-xs font-semibold text-red-300">
                        Verification failed ({r.verificationConfidence}%) — defect may still be present
                      </span>
                    </div>
                    <button className="btn-danger !py-1.5 !text-xs" onClick={() => api.reopenRepair(r.id)}>
                      Reopen repair case
                    </button>
                  </div>
                  {r.verificationPasses && (
                    <ul className="mt-2 space-y-1 text-xs text-gray-400">
                      {r.verificationPasses.map((p, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${p.defectDetected ? 'bg-red-500' : 'bg-green-500'}`} />
                          {p.vehicleId} — {p.defectDetected ? 'defect still detected' : 'no defect detected'}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
