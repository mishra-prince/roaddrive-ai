import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { CONTRIBUTORS } from '../../data/vehicles';
import { timeAgo } from '../../utils/severity';
import { Users, Truck } from 'lucide-react';

/**
 * Users — anonymous contributing fleet (spec §13 privacy: IDs only, never
 * personal information).
 */
export default function AdminUsers() {
  const { api } = useStore();
  const hazards = api.getHazards();
  const totalObs = CONTRIBUTORS.reduce((s, c) => s + c.observations, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contributing Fleet"
        sub={`${CONTRIBUTORS.length} active vehicles · ${totalObs.toLocaleString()} observations this month`}
      />

      <section className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <b>Privacy-first:</b> contributors are identified only by anonymous vehicle IDs. No personal information is collected or displayed.
      </section>

      <section className="card overflow-hidden">
        <div className="rd-scroll overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="th"><span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" aria-hidden /> Vehicle</span></th>
                <th className="th">Class</th>
                <th className="th">Observations</th>
                <th className="th">Confirmations</th>
                <th className="th">Reliability</th>
                <th className="th">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CONTRIBUTORS.map((c) => {
                const confirmations = hazards.filter((h) => h.observations.some((o) => o.vehicleId === c.vehicleId)).length;
                return (
                  <tr key={c.vehicleId} className="hover:bg-gray-50">
                    <td className="td font-bold text-ink">{c.vehicleId}</td>
                    <td className="td capitalize">{c.vehicleClass}</td>
                    <td className="td font-semibold">{c.observations.toLocaleString()}</td>
                    <td className="td font-semibold">{confirmations}</td>
                    <td className="td">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-16 rounded-full bg-gray-200" aria-hidden>
                          <span className="block h-1.5 rounded-full bg-green-500" style={{ width: `${c.reliability}%` }} />
                        </span>
                        {c.reliability}%
                      </span>
                    </td>
                    <td className="td text-gray-500">{timeAgo(c.lastActive)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <Users className="h-3 w-3" aria-hidden /> Fleet data is simulated and anonymized for the demo.
      </p>
    </div>
  );
}
