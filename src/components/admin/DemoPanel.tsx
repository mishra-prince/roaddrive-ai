import { useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { cn } from '../../utils/severity';
import { useStore } from '../../api/store';
import type { Hazard } from '../../types';

/**
 * Floating admin demo controls — the deterministic SIH scenario triggers.
 * Each button drives the same store mutations the real UI would.
 */
export default function DemoPanel() {
  const { api } = useStore();
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const ph1024 = api.getHazards().find((h) => h.id === 'PH-1024') as Hazard | undefined;
  const rc2381 = api.getRepairs().find((r) => r.id === 'RC-2381');

  const note = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4));

  const actions: Array<{ label: string; run: () => void; disabled?: boolean }> = [
    {
      label: 'Simulate pothole detection (new)',
      run: () => {
        const id = api.submitReport({ type: 'pothole', description: 'Simulated detection from dashboard camera', severity: 'high', lat: 28.4749, lng: 77.0731 });
        note(`New provisional hazard ${id} created`);
      },
    },
    {
      label: 'Simulate duplicate detection (confirm PH-1024)',
      run: () => {
        if (!ph1024) return;
        api.confirmHazard('PH-1024');
        note(`PH-1024 confirmations ${ph1024.confirmationCount} → ${ph1024.confirmationCount + 1}`);
      },
    },
    {
      label: 'Assign repair for PH-1024',
      run: () => {
        if (!ph1024 || ph1024.status === 'assigned' || rc2381?.status !== 'unassigned') {
          api.createRepair('PH-1024', 'Road Maintenance Division');
          note('Repair case created for PH-1024');
          return;
        }
        api.createRepair('PH-1024', 'Road Maintenance Division');
        note('RC-2381 assigned to Road Maintenance Division');
      },
      disabled: !ph1024 || ph1024.status === 'under_repair' || ['assigned', 'under_repair', 'repaired', 'verification_pending', 'verified'].includes(ph1024.status),
    },
    {
      label: 'Mark PH-1024 repair completed',
      run: () => {
        const rc = api.getRepairs().find((r) => r.hazardId === 'PH-1024');
        if (!rc) return;
        api.updateRepairStatus(rc.id, 'repaired');
        note(`${rc.id} marked repaired → verification pending`);
      },
      disabled: !rc2381 || !['assigned', 'under_repair'].includes(rc2381.status),
    },
    {
      label: 'Simulate successful verification (PH-1024)',
      run: () => {
        const rc = api.getRepairs().find((r) => r.hazardId === 'PH-1024');
        if (!rc) return;
        api.simulateVerification(rc.id, 'success');
        note(`${rc.id} verified — 5 clean passes`);
      },
      disabled: !rc2381 || rc2381.status !== 'verification_pending',
    },
    {
      label: 'Simulate failed verification (PH-1024)',
      run: () => {
        const rc = api.getRepairs().find((r) => r.hazardId === 'PH-1024');
        if (!rc) return;
        api.simulateVerification(rc.id, 'failure');
        note(`${rc.id} failed — defect still detected, reopened`);
      },
      disabled: !rc2381 || rc2381.status !== 'verification_pending',
    },
    {
      label: 'Reset demo state',
      run: () => {
        api.resetDemo();
        note('Demo reset to seeded dataset');
      },
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-30 print:hidden">
      {open && (
        <div className="mb-2 w-80 rounded-xl border border-line bg-card p-3 shadow-raised">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Demo controls</span>
            <button onClick={() => setOpen(false)} aria-label="Close demo controls" className="text-gray-400 hover:text-gray-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {actions.map((a) => (
              <button
                key={a.label}
                disabled={a.disabled}
                onClick={a.run}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors',
                  a.disabled
                    ? 'cursor-not-allowed border-line bg-white/5 text-gray-400'
                    : 'border-line bg-card text-gray-300 hover:border-primary-500/40 hover:bg-primary-500/15',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
          {log.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-line pt-2">
              {log.map((l, i) => (
                <li key={i} className={cn('text-[11px]', i === 0 ? 'font-semibold text-green-300' : 'text-gray-400')}>
                  ✓ {l}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-raised hover:bg-gray-800"
        aria-expanded={open}
      >
        <FlaskConical className="h-4 w-4" aria-hidden />
        {open ? 'Hide scenarios' : 'Demo scenarios'}
      </button>
    </div>
  );
}
