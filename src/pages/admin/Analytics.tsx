import { BarChart3, TrendingUp, PieChart, Timer, MapPin, BadgeCheck } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart as RePie, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { SEVERITY_META } from '../../utils/severity';

/**
 * Analytics (spec §30) — Recharts over the live store + clearly-labelled
 * demo trend series. No manufactured scientific conclusions.
 */

const TREND = [
  { day: 'Mon', detected: 342, verified: 288 },
  { day: 'Tue', detected: 389, verified: 330 },
  { day: 'Wed', detected: 371, verified: 318 },
  { day: 'Thu', detected: 415, verified: 352 },
  { day: 'Fri', detected: 428, verified: 369 },
  { day: 'Sat', detected: 386, verified: 337 },
  { day: 'Sun', detected: 359, verified: 311 },
];

const REPAIR_PERF = [
  { severity: 'Critical', days: 2.1 },
  { severity: 'High', days: 3.4 },
  { severity: 'Moderate', days: 4.8 },
  { severity: 'Low', days: 6.9 },
];

export default function Analytics() {
  const { api } = useStore();
  const hazards = api.getHazards();
  const repairs = api.getRepairs();

  const sevDist = (['critical', 'high', 'moderate', 'low'] as const).map((s) => ({
    name: SEVERITY_META[s].label,
    value: hazards.filter((h) => h.severity === s).length,
    color: SEVERITY_META[s].hex,
  }));

  const byRoad = new Map<string, { count: number; avgRisk: number }>();
  for (const h of hazards) {
    const cur = byRoad.get(h.roadName) ?? { count: 0, avgRisk: 0 };
    byRoad.set(h.roadName, { count: cur.count + 1, avgRisk: (cur.avgRisk * cur.count + h.riskScore) / (cur.count + 1) });
  }
  const hotspots = [...byRoad.entries()]
    .map(([road, v]) => ({ road, hazards: v.count, avgRisk: Math.round(v.avgRisk) }))
    .sort((a, b) => b.hazards - a.hazards)
    .slice(0, 6);

  const verifiedCount = repairs.filter((r) => r.status === 'verified').length;
  const failedCount = repairs.filter((r) => r.status === 'failed').length;
  const pendingCount = repairs.filter((r) => ['verification_pending', 'repaired'].includes(r.status)).length;
  const verifData = [
    { name: 'Verified', value: verifiedCount, color: '#16A34A' },
    { name: 'Failed', value: failedCount, color: '#DC2626' },
    { name: 'Pending', value: pendingCount, color: '#CA8A04' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        sub="Demo data — platform-wide intelligence"
        right={<span className="chip border-amber-300 bg-amber-50 text-amber-700">Simulated data</span>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Hazard trend */}
        <section className="card card-pad">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><TrendingUp className="h-4 w-4" aria-hidden /> Hazard trend (this week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="detected" name="Detected" stroke="#2557E7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="verified" name="Crowd-verified" stroke="#16A34A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Severity distribution */}
        <section className="card card-pad">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><PieChart className="h-4 w-4" aria-hidden /> Severity distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RePie>
              <Pie data={sevDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {sevDist.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
        </section>

        {/* Repair performance */}
        <section className="card card-pad">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><Timer className="h-4 w-4" aria-hidden /> Average repair time by severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REPAIR_PERF}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" d" />
              <Tooltip formatter={(v) => [`${v} days`, 'Avg repair time']} />
              <Bar dataKey="days" fill="#2557E7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Hotspots */}
        <section className="card card-pad">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><MapPin className="h-4 w-4" aria-hidden /> Hotspot areas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hotspots} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="road" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="hazards" name="Hazards" fill="#EA580C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Verification rate */}
        <section className="card card-pad lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><BadgeCheck className="h-4 w-4" aria-hidden /> Repair verification outcomes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={verifData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {verifData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[11px] text-gray-400">
            {verifiedCount} verified · {failedCount} failed · {pendingCount} pending — from the live demo store.
          </p>
        </section>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <BarChart3 className="h-3 w-3" aria-hidden /> All series are simulated for demonstration. No conclusions should be drawn from demo data.
      </p>
    </div>
  );
}
