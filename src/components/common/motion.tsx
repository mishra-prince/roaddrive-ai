import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/severity';

/**
 * Motion infrastructure — small, purposeful, reduced-motion-aware.
 * Every animation here clarifies state or depth; none loops for theater.
 */

// ─── Reveal on scroll (IntersectionObserver, no library) ──────────────────────

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity .6s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .6s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

// ─── Count-up number (rAF, eased, respects reduced motion) ──────────────────

export function CountUp({
  to,
  suffix = '',
  duration = 900,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || done.current) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Magnetic button (subtle translate toward cursor) ─────────────────────────

export function Magnetic({ children, className, strength = 0.18 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setT({ x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength });
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      style={{
        transform: `translate(${t.x}px, ${t.y}px)`,
        transition: t.x === 0 && t.y === 0 ? 'transform .35s cubic-bezier(.22,.61,.36,1)' : 'transform .08s linear',
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated gradient ring for the driveability dial ───────────────────────

export function DialRing({ score, size = 64 }: { score: number; size?: number }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(score);
      return;
    }
    const t = setTimeout(() => setProgress(score), 120);
    return () => clearTimeout(t);
  }, [score]);
  const tone = score >= 85 ? '#16A34A' : score >= 65 ? '#CA8A04' : score >= 45 ? '#EA580C' : '#DC2626';
  return (
    <div
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${tone} ${progress * 3.6}deg, #E7EAEE 0deg)`,
        transition: 'background 1.1s cubic-bezier(.22,.61,.36,1)',
      }}
      role="img"
      aria-label={`${score} out of 100`}
    >
      <div className="grid place-items-center rounded-full bg-white" style={{ width: size - 10, height: size - 10 }}>
        <span className="text-lg font-bold tabular-nums" style={{ color: tone }}>
          <CountUp to={score} />
        </span>
      </div>
    </div>
  );
}

// ─── Smooth scroll (Lenis) — mounted once at app root ────────────────────────

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lenis: any;
    let raf = 0;
    let dead = false;
    (async () => {
      const mod = await import('lenis');
      if (dead) return;
      const Lenis = mod.default;
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
  return null;
}

// ─── Custom cursor (desktop only, pointer precision) ────────────────────────

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // only on precise pointers (desktop); touch devices keep the native cursor
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('rd-has-cursor');
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    let tx = rx, ty = ry;
    let raf = 0;

    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      setVisible(true);
      const el = e.target as HTMLElement;
      setHovering(!!el.closest('a, button, [role="button"], input, select, textarea, .rd-hoverable'));
    };
    const loop = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', move, { passive: true });

    return () => {
      document.documentElement.classList.remove('rd-has-cursor');
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn('rd-cursor-root', !visible && 'rd-cursor-hidden')} aria-hidden>
      <div ref={dotRef} className="rd-cursor-dot" />
      <div ref={ringRef} className={cn('rd-cursor-ring', hovering && 'rd-cursor-ring-hot')} />
    </div>
  );
}
