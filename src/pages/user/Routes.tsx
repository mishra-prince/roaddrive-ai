import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, CarFront, ArrowRight } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { cn, scoreTone, CONDITION_META } from '../../utils/severity';
import type { RouteOption } from '../../types';

export default function Routes() {
  const { api } = useStore();
  const navigate = useNavigate();
  const routes = api.getRoutes();
  const [active, setActive] = useState('recommended');
  const current = routes.find((r) => r.id === active)!;

  return (
    <div className="space-y-4">
      <PageHeader title="Routes" sub="Home → Cyber Hub" />

      {/* destination card */}
      <section className="card card-pad space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="h-4 w-4 text-muted" aria-hidden />
          <span className="font-semibold text-ink">Current Location</span>
          <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-soft" aria-hidden />
          <span className="font-semibold text-ink">Cyber Hub</span>
        </div>
      </section>

      {/* route options */}
      <section className="space-y-3">
        {routes.map((r) => (
          <RouteCard key={r.id} route={r} active={active === r.id} onSelect={() => setActive(r.id)} />
        ))}
      </section>

      {/* why recommended */}
      <section className="card card-pad">
        <h3 className="text-sm font-bold text-ink">
          {current.recommended ? 'Recommended because:' : `${current.label} route notes:`}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {current.reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-xs text-muted">
              {current.recommended ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" aria-hidden />
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden />
              )}
              {reason}
            </li>
          ))}
        </ul>
      </section>

      {/* segment conditions */}
      <section className="card card-pad">
        <h3 className="mb-2 text-sm font-bold text-ink">Segment conditions</h3>
        <div className="space-y-2">
          {current.segments.map((s) => {
            const m = CONDITION_META[s.condition];
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.hex }} aria-hidden />
                <span className="flex-1 text-xs font-medium text-ink-soft">{s.name}</span>
                <span className="text-xs text-muted">{m.label}</span>
                <span className="w-16 text-right text-xs font-bold" style={{ color: m.hex }}>{s.driveability}/100</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-[11px] text-muted">
          <span>Distance <b className="text-ink">{current.distanceKm} km</b></span>
          <span>ETA <b className="text-ink">{current.durationMin} min</b></span>
          <span>Driveability <b className="text-ink">{current.driveability}/100</b></span>
          <span>Hazards <b className="text-ink">{current.hazardCount}</b></span>
        </div>
      </section>

      <button className="btn-primary w-full" onClick={() => navigate('/app/drive')}>
        <CarFront className="h-4 w-4" aria-hidden /> Drive this route
      </button>
      <p className="pb-2 text-center text-[11px] text-muted">
        Mock routing — no full turn-by-turn navigation in this prototype.
      </p>
    </div>
  );
}

function RouteCard({ route, active, onSelect }: { route: RouteOption; active: boolean; onSelect: () => void }) {
  const tone = scoreTone(route.driveability);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'card card-pad w-full text-left transition-shadow',
        active ? 'ring-2 ring-primary-400' : 'hover:shadow-raised',
      )}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink">{route.label}</span>
          {route.recommended && (
            <span className="chip border-green-500/30 bg-green-500/10 text-green-300">✓ Recommended</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-ink">{route.durationMin} min</div>
          <div className="text-xs text-muted">{route.distanceKm} km</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-muted">Driveability</span>
        <span className={cn('font-bold', tone.text)}>{route.driveability}/100</span>
        <span className="text-muted">·</span>
        <span className={route.criticalHazards > 0 ? 'font-semibold text-red-400' : 'font-semibold text-green-300'}>
          {route.criticalHazards > 0 ? `${route.criticalHazards} high-risk hazards` : 'No critical hazards'}
        </span>
      </div>
    </button>
  );
}
