import { Link, useNavigate } from 'react-router-dom';
import { Map as MapIcon, CarFront, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../../api/store';
import { SeverityChip, StatCard, PageHeader, DemoBadge } from '../../components/common';
import { DialRing } from '../../components/common/motion';
import { areaDriveability, nearestHazard } from '../../utils/driveability';
import { SEVERITY_META, timeAgo, HAZARD_TYPE_META } from '../../utils/severity';
import { formatDistance } from '../../utils/geo';
import { HOME } from '../../data/geoBase';

export default function UserHome() {
  const { api } = useStore();
  const navigate = useNavigate();
  const segments = api.getSegments();
  const hazards = api.getHazards();
  const area = areaDriveability(segments);
  const current = segments.find((s) => s.id === 'rd-s29') ?? segments[0];
  const near = nearestHazard(hazards, HOME);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${greeting}, Alex`}
        sub={`Current area — Gurugram, Haryana`}
        right={<DemoBadge />}
      />

      {/* Driveability summary */}
      <section className="card card-pad">
        <div className="flex items-center gap-3">
          <DialRing score={area} size={72} />
          <div>
            <div className="label-xs">Road driveability (area)</div>
            <div className={`text-sm font-semibold ${area >= 85 ? 'text-green-300' : area >= 65 ? 'text-yellow-300' : area >= 45 ? 'text-orange-300' : 'text-red-300'}`}>
              {area >= 85 ? 'Good conditions' : area >= 65 ? 'Moderate conditions' : 'High risk conditions'}
            </div>
            <div className="text-xs text-gray-400">out of 100 · Gurugram</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4">
          <div>
            <div className="label-xs">Traffic</div>
            <div className="text-sm font-semibold capitalize">{current.trafficLevel}</div>
          </div>
          <div>
            <div className="label-xs">Surface</div>
            <div className="text-sm font-semibold">{area >= 65 ? 'Good' : 'Worn'}</div>
          </div>
          <div>
            <div className="label-xs">Hazards</div>
            <div className="text-sm font-semibold">
              {hazards.filter((h) => h.severity === 'low').length} minor nearby
            </div>
          </div>
          <div>
            <div className="label-xs">Weather</div>
            <div className="text-sm font-semibold">Clear</div>
          </div>
        </div>
      </section>

      {/* Nearest hazard */}
      {near && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: SEVERITY_META[near.hazard.severity].hex }}>
              Nearby hazard
            </span>
            <SeverityChip severity={near.hazard.severity} />
          </div>
          <div className="card-pad flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-ink">
                {HAZARD_TYPE_META[near.hazard.type].label} · {near.hazard.roadName}
              </div>
              <div className="mt-0.5 text-sm text-gray-400">{formatDistance(near.distanceM)} ahead</div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>Confidence <b className="text-ink">{near.hazard.confidence}%</b></span>
                <span>Confirmed by <b className="text-ink">{near.hazard.confirmationCount}</b></span>
                <span>Detected {timeAgo(near.hazard.lastDetected)}</span>
              </div>
            </div>
            <button
              className="btn-ghost !px-2"
              aria-label="View hazard details"
              onClick={() => navigate(`/app/hazard/${near.hazard.id}`)}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {/* CTAs */}
      <section className="grid grid-cols-2 gap-3">
        <button className="btn-primary h-14 text-base" onClick={() => navigate('/app/drive')}>
          <CarFront className="h-5 w-5" aria-hidden /> Start Drive
        </button>
        <Link className="btn-secondary h-14 text-base" to="/app/map">
          <MapIcon className="h-5 w-5" aria-hidden /> View Live Map
        </Link>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active hazards" value={hazards.filter((h) => !['repaired', 'verified', 'verification_pending'].includes(h.status)).length} sub="in your area" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Routes checked" value="3" sub="Home → Cyber Hub" tone="good" icon={<MapIcon className="h-4 w-4" />} />
        <StatCard label="Your reports" value="2" sub="1 confirmed" tone="good" />
        <StatCard label="Journey today" value="21 min" sub="13.1 km · 89 driveability" />
      </section>

      {/* Privacy */}
      <section className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" aria-hidden />
        <p className="text-xs text-green-300">
          <b>Privacy protected.</b> Faces and license plates are automatically blurred before evidence is stored.
        </p>
      </section>
      <p className="pb-2 text-center text-[11px] text-gray-400">
        Scores are estimates from simulated data — driveability, not guarantees.
      </p>
    </div>
  );
}
