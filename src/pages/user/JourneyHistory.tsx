import { History as HistoryIcon, Route as RouteIcon } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader, EmptyState } from '../../components/common';
import { fmtDateShort, isToday, scoreTone, cn } from '../../utils/severity';

export default function JourneyHistory() {
  const { api } = useStore();
  const journeys = api.getJourneys();
  const today = journeys.filter((j) => isToday(j.date));
  const past = journeys.filter((j) => !isToday(j.date));

  return (
    <div className="space-y-4">
      <PageHeader title="History" sub="Your recent journeys" />

      {today.length > 0 && (
        <section className="card card-pad">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Today's Drive</h3>
            <span className="chip border-line bg-soft text-muted">{today[0].durationMin} min · {today[0].distanceKm} km</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', scoreTone(today[0].driveability).text)}>{today[0].driveability}</span>
            <span className="text-xs text-muted">driveability · {today[0].hazardsEncountered} hazards encountered</span>
          </div>
        </section>
      )}

      {past.length === 0 && today.length === 0 ? (
        <EmptyState title="No journeys yet" body="Start a drive and your trips will appear here with driveability scores." />
      ) : (
        <section className="card divide-y divide-line">
          {past.map((j) => (
            <div key={j.id} className="card-pad flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/15 text-primary-300" aria-hidden>
                <RouteIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{j.from} → {j.to}</div>
                <div className="text-xs text-muted">{fmtDateShort(j.date)} · {j.durationMin} min · {j.distanceKm} km</div>
              </div>
              <div className="text-right">
                <div className={cn('text-sm font-bold', scoreTone(j.driveability).text)}>{j.driveability}</div>
                <div className="text-[10px] text-muted">driveability</div>
              </div>
            </div>
          ))}
        </section>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <HistoryIcon className="h-3 w-3" aria-hidden /> Journey data is simulated for the demo.
      </p>
    </div>
  );
}
