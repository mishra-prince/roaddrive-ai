import { Link } from 'react-router-dom';
import { CarFront, Radio, ArrowRight, ShieldCheck, Zap, MapPinned } from 'lucide-react';

/**
 * Landing — splits visitors into the two product interfaces.
 * This is a Decide/Learn surface: one idea per section, hero is appropriate here.
 */
export default function Landing() {
  return (
    <div className="min-h-full bg-surface">
      {/* nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white" aria-hidden>
            <Radio className="h-5 w-5" />
          </div>
          <span className="text-base font-bold text-ink">RoadDrive AI</span>
        </div>
        <span className="chip border-amber-300 bg-amber-50 text-amber-700">DEMO MODE</span>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-5 pb-10 pt-6 text-center sm:pt-12">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Real-time crowdsourced road-driveability intelligence
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Ordinary vehicles sense road hazards. AI validates them across users. Drivers get warnings and better routes.
          Authorities get a live operational picture — from detection to verified repair.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/app" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
            <CarFront className="h-5 w-5" aria-hidden /> Open Driver App
          </Link>
          <span className="hidden w-full px-6 py-3 text-center text-sm text-gray-400 sm:block sm:w-auto">
            Authority console access is invite-only.
          </span>
        </div>
      </section>

      {/* pillars */}
      <section className="mx-auto max-w-5xl px-5 pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPinned, title: 'SENSE', body: 'Ordinary vehicles contribute road observations from dashcams and smartphones.' },
            { icon: Zap, title: 'UNDERSTAND', body: 'AI + crowdsourcing converts observations into live driveability intelligence.' },
            { icon: ArrowRight, title: 'ACT', body: 'Drivers receive warnings and route recommendations; authorities receive actionable workflows.' },
          ].map((p) => (
            <div key={p.title} className="card card-pad">
              <p.icon className="h-5 w-5 text-primary-600" aria-hidden />
              <h2 className="mt-2.5 text-sm font-bold tracking-wide text-ink">{p.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 pb-8">
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Frontend prototype — detection, GPS, routing and verification are simulated with deterministic mock data. No API keys required.
        </p>
      </footer>
    </div>
  );
}
