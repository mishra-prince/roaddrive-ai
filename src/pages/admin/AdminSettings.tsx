import { useState } from 'react';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { ShieldCheck, Bell, Database, KeyRound } from 'lucide-react';

export default function AdminSettings() {
  const { api } = useStore();
  const [alertsCritical, setAlertsCritical] = useState(true);
  const [alertsRepairVerified, setAlertsRepairVerified] = useState(true);

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Settings" sub="Authority operations preferences" />

      <section className="card card-pad space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><Bell className="h-4 w-4" aria-hidden /> Alerts</h3>
        {[
          { label: 'Critical hazard alerts', desc: 'Immediate alert when a critical hazard is confirmed', val: alertsCritical, set: setAlertsCritical },
          { label: 'Repair verification outcomes', desc: 'Alert when a repair is verified or fails verification', val: alertsRepairVerified, set: setAlertsRepairVerified },
        ].map((row) => (
          <label key={row.label} className="flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold text-ink">{row.label}</span>
              <span className="text-xs text-muted">{row.desc}</span>
            </span>
            <input type="checkbox" className="h-5 w-9 accent-primary-600" checked={row.val} onChange={(e) => row.set(e.target.checked)} role="switch" />
          </label>
        ))}
      </section>

      <section className="card card-pad space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><Database className="h-4 w-4" aria-hidden /> Data source</h3>
        <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
          <b>Demo mode active.</b> All hazards, repairs and observations are simulated deterministically. Integration points
          are isolated in the mock API layer — swapping to a real backend (FastAPI, PostgreSQL) requires no UI changes.
        </div>
        <button className="btn-secondary !text-xs" onClick={() => api.resetDemo()}>Reset demo state</button>
      </section>

      <section className="card card-pad space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><KeyRound className="h-4 w-4" aria-hidden /> Map provider</h3>
        <p className="text-xs text-muted">
          OpenStreetMap tiles + self-hosted CesiumJS assets. No API keys are stored or required — provider-specific
          configuration is isolated so a commercial 3D provider can be added via environment variables.
        </p>
      </section>

      <section className="card card-pad space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><ShieldCheck className="h-4 w-4" aria-hidden /> Privacy</h3>
        <p className="text-xs text-muted">
          Faces and license plates are automatically blurred before evidence is stored (simulated). Contributions are
          anonymous vehicle IDs only.
        </p>
      </section>
    </div>
  );
}
