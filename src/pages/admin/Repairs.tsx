import { useSearchParams, Link } from 'react-router-dom';
import { Wrench, UserPlus, StickyNote, ArrowLeft, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../api/store';
import { PageHeader, StatusChip, SeverityChip, EmptyState } from '../../components/common';
import { fmtDateShort, fmtDateTime, timeAgo } from '../../utils/severity';
import { cn } from '../../utils/severity';
import { REPAIR_LIFECYCLE } from '../../utils/severity';

/**
 * Repairs — lifecycle stepper (spec §27) + repair detail (spec §28) +
 * verification result panels (spec §29).
 */
export default function Repairs() {
  const { api } = useStore();
  const [params] = useSearchParams();
  const repairs = api.getRepairs();
  const openId = params.get('id');
  const open = repairs.find((r) => r.id === openId);
  const hazardOf = (id: string) => api.getHazardById(id);

  return (
    <div className="space-y-4">
      <PageHeader title="Repairs" sub={`${repairs.length} repair cases`} />

      {repairs.length === 0 ? (
        <EmptyState title="No repair cases" body="Assign a verified hazard from the hazard table to open the first repair case." />
      ) : (
        <section className="card divide-y divide-line">
          {repairs.map((r) => {
            const h = hazardOf(r.hazardId);
            return (
              <Link key={r.id} to={`/admin/repairs?id=${r.id}`} className={cn('card-pad flex flex-wrap items-center justify-between gap-3 hover:bg-soft', openId === r.id && 'bg-primary-500/15/40')}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{r.id}</span>
                    <span className="text-xs text-muted">{r.hazardId} · {h?.roadName ?? '—'}</span>
                    {h && <SeverityChip severity={h.severity} />}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {r.assignedDepartment ?? 'Unassigned'} · expected {r.expectedCompletion ? fmtDateShort(r.expectedCompletion) : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] text-muted sm:inline">repaired {r.repairedAt ? timeAgo(r.repairedAt) : '—'}</span>
                  <StatusChip status={r.status} />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* detail */}
      {open && <RepairDetail id={open.id} />}
    </div>
  );
}

function RepairDetail({ id }: { id: string }) {
  const { api } = useStore();
  const r = api.getRepairs().find((x) => x.id === id)!;
  const h = api.getHazardById(r.hazardId);
  const [note, setNote] = useState('');

  const idx =
    r.status === 'failed' ? 4
    : r.status === 'verified' ? 5
    : REPAIR_LIFECYCLE.indexOf(r.status);

  return (
    <section className="card card-pad space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-ink">Repair Case {r.id}</h2>
          <p className="text-sm text-muted">
            {h ? `${h.id} · ${h.roadName}` : r.hazardId} · {h ? '' : ''}{r.assignedDepartment ?? 'Unassigned'}
          </p>
        </div>
        <StatusChip status={r.status} />
      </div>

      {/* stepper */}
      <div aria-label="Repair lifecycle">
        <ol className="rd-scroll flex items-center overflow-x-auto">
          {REPAIR_LIFECYCLE.map((step, i) => {
            const done = i <= idx;
            const failedHere = r.status === 'failed' && i === 4;
            return (
              <li key={step} className="flex min-w-max items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-bold',
                      failedHere
                        ? 'border-red-500 bg-red-500 text-white'
                        : done
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-line bg-card text-muted',
                    )}
                    aria-hidden
                  >
                    {failedHere ? '✕' : done ? '✓' : i + 1}
                  </span>
                  <span className={cn('w-20 text-center text-[10px] font-semibold capitalize', done ? 'text-ink' : 'text-muted')}>
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
                {i < REPAIR_LIFECYCLE.length - 1 && (
                  <span className={cn('mb-5 h-0.5 w-8 sm:w-12', i < idx ? 'bg-primary-600' : 'bg-soft-strong')} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
        {r.status === 'failed' && (
          <p className="mt-2 text-xs font-semibold text-red-300">
            Verification failed → case can be reopened (defect may still be present).
          </p>
        )}
      </div>

      {/* facts */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
        <div><dt className="label-xs">Hazard</dt><dd className="mt-0.5 font-semibold">{r.hazardId}</dd></div>
        <div><dt className="label-xs">Severity</dt><dd className="mt-0.5">{h ? <SeverityChip severity={h.severity} /> : '—'}</dd></div>
        <div><dt className="label-xs">Assigned department</dt><dd className="mt-0.5 font-semibold">{r.assignedDepartment ?? '—'}</dd></div>
        <div><dt className="label-xs">Assigned on</dt><dd className="mt-0.5 font-semibold">{r.assignedAt ? fmtDateShort(r.assignedAt) : '—'}</dd></div>
        <div><dt className="label-xs">Expected completion</dt><dd className="mt-0.5 font-semibold">{r.expectedCompletion ? fmtDateShort(r.expectedCompletion) : '—'}</dd></div>
        <div><dt className="label-xs">Repaired at</dt><dd className="mt-0.5 font-semibold">{r.repairedAt ? fmtDateTime(r.repairedAt) : '—'}</dd></div>
        <div><dt className="label-xs">Verification</dt><dd className="mt-0.5 font-semibold">{r.verificationConfidence ? `${r.verificationConfidence}%` : '—'}</dd></div>
        <div><dt className="label-xs">Current status</dt><dd className="mt-0.5"><StatusChip status={r.status} /></dd></div>
      </dl>

      {/* verification passes */}
      {r.verificationPasses && r.verificationPasses.length > 0 && (
        <div>
          <h3 className="label-xs mb-2">Independent verification passes</h3>
          <ul className="space-y-1.5">
            {r.verificationPasses.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-ink-soft">
                <span className={cn('h-2 w-2 rounded-full', p.defectDetected ? 'bg-red-500' : 'bg-green-500')} aria-hidden />
                <span className="font-semibold">{p.vehicleId}</span> — {p.defectDetected ? 'defect still detected' : 'no defect detected'} · {timeAgo(p.at)}
              </li>
            ))}
          </ul>
          {r.status === 'verified' && (
            <p className="mt-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300">
              REPAIR VERIFIED — {r.verificationPasses.filter((p) => !p.defectDetected).length} independent clean passes · confidence {r.verificationConfidence}%
            </p>
          )}
          {r.status === 'failed' && (
            <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
              VERIFICATION FAILED — the road defect may still be present · confidence {r.verificationConfidence}%
            </p>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex flex-wrap gap-2">
        {r.status === 'unassigned' && (
          <button className="btn-primary !text-xs" onClick={() => api.updateRepairStatus(r.id, 'assigned')}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden /> Assign
          </button>
        )}
        {r.status === 'assigned' && (
          <button className="btn-primary !text-xs" onClick={() => api.updateRepairStatus(r.id, 'under_repair')}>
            <Wrench className="h-3.5 w-3.5" aria-hidden /> Start repair
          </button>
        )}
        {r.status === 'under_repair' && (
          <button className="btn-primary !text-xs" onClick={() => api.updateRepairStatus(r.id, 'repaired')}>
            <Wrench className="h-3.5 w-3.5" aria-hidden /> Mark repaired
          </button>
        )}
        {r.status === 'repaired' && (
          <button className="btn-primary !text-xs" onClick={() => api.updateRepairStatus(r.id, 'verification_pending')}>
            Begin AI verification
          </button>
        )}
        {r.status === 'verification_pending' && (
          <>
            <button className="btn-primary !text-xs" onClick={() => api.simulateVerification(r.id, 'success')}>
              Simulate successful verification
            </button>
            <button className="btn-secondary !text-xs" onClick={() => api.simulateVerification(r.id, 'failure')}>
              Simulate failed verification
            </button>
          </>
        )}
        {r.status === 'failed' && (
          <button className="btn-danger !text-xs" onClick={() => api.reopenRepair(r.id)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reopen repair case
          </button>
        )}
        <Link className="btn-ghost !text-xs" to={`/admin/hazards?id=${r.hazardId}`}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> View hazard {r.hazardId}
        </Link>
      </div>

      {/* notes */}
      <div>
        <h3 className="label-xs mb-2">Case notes</h3>
        <ul className="space-y-2">
          {r.notes.map((n, i) => (
            <li key={i} className="rounded-lg bg-soft px-3 py-2 text-xs text-ink-soft">
              <span className="font-semibold">{n.author}</span> · {timeAgo(n.at)} — {n.text}
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            api.addRepairNote(r.id, note.trim());
            setNote('');
          }}
        >
          <input className="input" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" />
          <button className="btn-secondary !text-xs" type="submit">
            <StickyNote className="h-3.5 w-3.5" aria-hidden /> Add note
          </button>
        </form>
      </div>
    </section>
  );
}
