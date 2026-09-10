import { Link } from 'react-router-dom';
import { CarFront, Radio, ArrowRight, ShieldCheck, Zap, MapPinned, ChevronRight } from 'lucide-react';
import { Reveal, Magnetic, CountUp, Cursor, SmoothScroll } from '../components/common/motion';
import { DemoBadge } from '../components/common';

/**
 * Landing — the one marketing surface, so expressive design is allowed here:
 * display typography, staged reveals, magnetic CTAs. Surface: Decide/Learn.
 * The app surfaces (user/admin) stay dense and calm.
 */
export default function Landing() {
  return (
    <>
      <Cursor />
      <SmoothScroll />
      <div className="min-h-full bg-surface">
        {/* nav */}
        <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-[0_4px_14px_rgba(37,87,231,0.35)]" aria-hidden>
                <Radio className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight text-ink">RoadDrive AI</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Road intelligence</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DemoBadge />
              <Magnetic>
                <Link to="/app" className="btn-primary !px-4 !py-2 text-sm">
                  Open app <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </Magnetic>
            </div>
          </div>
        </header>

        {/* hero */}
        <section className="relative overflow-hidden">
          {/* faint grid backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(#E4E8EE 1px, transparent 1px), linear-gradient(90deg, #E4E8EE 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 75%)',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 text-center sm:pt-24">
            <Reveal>
              <span className="chip mx-auto border-primary-500/30 bg-primary-500/15 text-primary-300">
                <Zap className="h-3 w-3" aria-hidden /> Crowdsourced · Real-time · Vehicle-aware
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl">
                Every vehicle senses.
                <br />
                <span className="text-primary-600">Every driver knows.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
                Ordinary vehicles detect road hazards. AI validates them across users. Drivers get warnings
                and better routes — authorities get a live operational picture, from detection to verified repair.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic>
                  <Link to="/app" className="btn-primary h-12 px-7 text-base shadow-[0_8px_24px_rgba(37,87,231,0.35)]">
                    <CarFront className="h-5 w-5" aria-hidden /> Open Driver App
                  </Link>
                </Magnetic>
                <span className="text-xs text-muted">No signup · works on your phone now</span>
              </div>
            </Reveal>

            {/* live stats strip */}
            <Reveal delay={340}>
              <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-card py-4 shadow-card">
                {[
                  { label: 'Active hazards tracked', value: 43 },
                  { label: 'Independent confirmations', value: 128 },
                  { label: 'Repairs verified', value: 87, suffix: '%' },
                ].map((s) => (
                  <div key={s.label} className="px-3">
                    <div className="text-xl font-bold tabular-nums text-ink sm:text-2xl">
                      <CountUp to={s.value} suffix={s.suffix ?? ''} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted">Demo dataset — simulated deterministically</p>
            </Reveal>
          </div>
        </section>

        {/* the loop — three pillars with connecting flow */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <Reveal>
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">
              One loop, three layers
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: MapPinned, title: 'SENSE', body: 'Ordinary vehicles contribute road observations from dashcams and smartphones — automatically, anonymously.', n: '01' },
              { icon: Zap, title: 'UNDERSTAND', body: 'AI + crowdsourcing converts raw observations into live, vehicle-specific driveability intelligence.', n: '02' },
              { icon: ArrowRight, title: 'ACT', body: 'Drivers receive warnings and recommended routes. Authorities receive actionable repair workflows.', n: '03' },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 110}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-500/40 hover:shadow-[0_16px_40px_-12px_rgba(37,87,231,0.25)]">
                  <span className="absolute -right-2 -top-4 text-6xl font-bold text-gray-100 transition-colors duration-300 group-hover:text-primary-100" aria-hidden>
                    {p.n}
                  </span>
                  <p.icon className="h-6 w-6 text-primary-600 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                  <h3 className="mt-4 text-sm font-bold tracking-[0.12em] text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
                  <div className="mt-5 h-0.5 w-8 rounded-full bg-soft-strong transition-all duration-300 group-hover:w-full group-hover:bg-primary-400" aria-hidden />
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* authority note */}
        <Reveal>
          <section className="mx-auto max-w-6xl px-5 pb-20">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card px-8 py-6 text-center shadow-card sm:flex-row sm:text-left">
              <ShieldCheck className="h-6 w-6 shrink-0 text-muted" aria-hidden />
              <p className="flex-1 text-sm text-muted">
                The <b className="text-ink">Authority Console</b> is a separate, access-controlled interface —
                3D spatial intelligence, verification queues and repair workflows. Access is issued by the road authority.
              </p>
            </div>
          </section>
        </Reveal>

        <footer className="border-t border-line px-5 pb-10 pt-8">
          <p className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 text-center text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Frontend prototype — detection, GPS, routing and verification are simulated. No API keys. Faces &amp; plates blurred.
          </p>
        </footer>
      </div>
    </>
  );
}
