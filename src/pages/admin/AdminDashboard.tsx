import { Link } from 'react-router-dom';
import { AlertTriangle, Wrench, BadgeCheck, Clock, ClipboardList, Users } from 'lucide-react';
import { useStore } from '../../api/store';
import { StatCard, PageHeader, SeverityChip } from '../../components/common';
import { CesiumMap } from '../../components/maps/CesiumMap';
import { areaDriveability } from '../../utils/driveability';
import { timeAgo } from '../../utils/severity';
import { CountUp, Reveal } from '../../components/common/motion';

export default function AdminDashboard() {
  const { api } = useStore();
  const hazards = api.getHazards();
  const repairs = api.getRepairs();
  const segments = api.getSegments();

  const active = hazards.filter((h) => !['repaired', 'verified', 'verification_pending'].includes(h.status));
  const critical = active.filter((h) => h.severity === 'critical');
  const pendingVerification = hazards.filter((h) => h.status === 'provisional');
  const underRepair = hazards.filter((h) => h.status === 'under_repair');
  const repairVerifPending = repairs.filter((r) => r.status === 'verification_pending');
  const verifiedRepairs = repairs.filter((r) => r.status === 'verified');

  // hotspots by road
  const byRoad = new Map<string, number>();
  for (const h of active) byRoad.set(h.roadName, (byRoad.get(h.roadName) ?? 0) + 1);
  const hotspots = [...byRoad.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const recentCritical = active
    .filter((h) => h.severity === 'critical' || h.severity === 'high')
    .sort((a, b) => +new Date(b.lastDetected) - +new Date(a.lastDetected))
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Road Intelligence Dashboard"
        sub={`Gurugram · area driveability ${areaDriveability(segments)}/100 · live`}
      />

      {/* KPIs */}
      <Reveal>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active hazards" value={<CountUp to={active.length} />} sub="city-wide" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Critical" value={<CountUp to={critical.length} />} tone="critical" sub="immediate attention" />
        <StatCard label="Pending verification" value={<CountUp to={pendingVerification.length} />} tone="warning" sub="awaiting confirmations" icon={<BadgeCheck className="h-4 w-4" />} />
        <StatCard label="Under repair" value={<CountUp to={underRepair.length} />} sub="assigned teams" icon={<Wrench className="h-4 w-4" />} />
        <StatCard label="Repair verification" value={repairVerifPending.length} tone="warning" sub="pending AI check" />
        <StatCard label="Verified repairs" value={`${verifiedRepairs.length}/${Math.max(1, repairs.filter((r) => ['verified', 'failed'].includes(r.status)).length)}`} tone="good" sub="pass rate" />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Avg repair time" value="3.8 days" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Reports today" value="428" icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Contributing vehicles" value="8" sub="active fleet" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Repair pass rate" value="87%" tone="good" sub="verified first time" />
      </section>
      </Reveal>

      {/* 3D map + side panel */}
      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-sm font-bold text-ink">Live 3D intelligence map</h2>
            <Link to="/admin/map" className="text-xs font-semibold text-primary-300 hover:underline">
              Open full map →
            </Link>
          </div>
          <CesiumMap hazards={active} height={460} compact />
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <h3 className="mb-2 text-sm font-bold text-ink">Critical areas</h3>
            <ol className="space-y-2.5">
              {hotspots.map(([road, count], i) => (
                <li key={road} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-gray-400">{i + 1}</span>
                    <span className="font-semibold text-ink">{road}</span>
                  </span>
                  <span className="chip border-red-500/30 bg-red-500/10 text-red-300">{count} hazards</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card card-pad">
            <h3 className="mb-2 text-sm font-bold text-ink">Latest high-severity detections</h3>
            <ul className="space-y-2.5">
              {recentCritical.map((h) => (
                <li key={h.id}>
                  <Link to={`/admin/hazards?id=${h.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <div>
                      <div className="text-xs font-bold text-ink">{h.id} · {h.roadName}</div>
                      <div className="text-[11px] text-gray-400">
                        {timeAgo(h.lastDetected)} · {h.confirmationCount} confirmations · {h.confidence}% conf.
                      </div>
                    </div>
                    <SeverityChip severity={h.severity} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
