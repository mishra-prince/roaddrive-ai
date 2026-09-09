import type { ReactNode } from 'react';
import { cn } from '../../utils/severity';
import { SEVERITY_META } from '../../utils/severity';
import type { Severity, HazardStatus, RepairStatus } from '../../types';
import { HAZARD_STATUS_META, REPAIR_STATUS_META } from '../../utils/severity';

export function SeverityChip({ severity, size = 'sm' }: { severity: Severity; size?: 'sm' | 'md' }) {
  const m = SEVERITY_META[severity];
  return (
    <span className={cn('chip', m.chip, size === 'md' && 'px-3 py-1.5 text-xs')} style={{ borderColor: m.hex }}>
      <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: m.hex }} />
      {m.label} severity
    </span>
  );
}

export function StatusChip({ status }: { status: HazardStatus | RepairStatus }) {
  const m = (HAZARD_STATUS_META as Record<string, { label: string; chip: string }>)[status]
    ?? (REPAIR_STATUS_META as Record<string, { label: string; chip: string }>)[status];
  return <span className={cn('chip', m?.chip ?? 'bg-gray-100 text-gray-700 border-gray-300')}>{m?.label ?? status}</span>;
}

export function ConfidenceBar({ value, label = 'AI confidence' }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label-xs">{label}</span>
        <span className="text-sm font-semibold text-ink">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200" role="presentation">
        <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScoreDial({ score, label = 'Driveability' }: { score: number; label?: string }) {
  const tone =
    score >= 85 ? 'text-green-700' : score >= 65 ? 'text-yellow-700' : score >= 45 ? 'text-orange-700' : 'text-red-700';
  const ring =
    score >= 85 ? '#16A34A' : score >= 65 ? '#CA8A04' : score >= 45 ? '#EA580C' : '#DC2626';
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 place-items-center rounded-full"
        style={{ background: `conic-gradient(${ring} ${score * 3.6}deg, #E5E7EB 0deg)` }}
        role="img"
        aria-label={`${label} ${score} out of 100`}
      >
        <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-white">
          <span className={cn('text-lg font-bold', tone)}>{score}</span>
        </div>
      </div>
      <div>
        <div className="label-xs">{label}</div>
        <div className={cn('text-sm font-semibold', tone)}>
          {score >= 85 ? 'Good conditions' : score >= 65 ? 'Moderate conditions' : score >= 45 ? 'Poor conditions' : 'High risk conditions'}
        </div>
        <div className="text-xs text-gray-500">out of 100</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'critical' | 'warning' | 'good';
  icon?: ReactNode;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="label-xs">{label}</div>
          <div
            className={cn(
              'mt-1 text-2xl font-bold tracking-tight',
              tone === 'critical' && 'text-red-600',
              tone === 'warning' && 'text-orange-600',
              tone === 'good' && 'text-green-600',
              tone === 'default' && 'text-ink',
            )}
          >
            {value}
          </div>
          {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-200', className)} />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card card-pad grid place-items-center py-12 text-center">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{body}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card card-pad grid place-items-center py-12 text-center">
      <div>
        <h3 className="text-base font-semibold text-red-700">Unable to load road data</h3>
        <p className="mt-1 text-sm text-gray-500">Please try again.</p>
        <button className="btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="chip border-amber-300 bg-amber-50 text-amber-700" title="All data shown is simulated for demonstration">
      DEMO MODE
    </span>
  );
}
