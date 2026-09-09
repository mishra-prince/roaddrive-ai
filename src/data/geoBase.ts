/**
 * Deterministic geo base for the demo dataset.
 * All "randomness" comes from a fixed-seed PRNG so every demo run is identical.
 * Area: Gurugram, Haryana (approximate civic coordinates — mock data).
 */

/** Session anchor; hazard timestamps are computed relative to this. */
export const T0 = Date.now();

export function minutesAgo(min: number): string {
  return new Date(T0 - min * 60_000).toISOString();
}

export function daysAgo(days: number, extraMin = 0): string {
  return new Date(T0 - (days * 24 * 60 + extraMin) * 60_000).toISOString();
}

/** Fixed-seed PRNG (mulberry32) — deterministic sequence every run. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Point at fraction `t` along a polyline (by cumulative distance). */
export function pointAlong(
  polyline: [number, number][],
  t: number,
): [number, number] {
  if (polyline.length === 0) return [28.4765, 77.0765];
  if (polyline.length === 1) return polyline[0];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < polyline.length; i++) {
    const d = Math.hypot(
      polyline[i][0] - polyline[i - 1][0],
      polyline[i][1] - polyline[i - 1][1],
    );
    segLens.push(d);
    total += d;
  }
  let target = total * Math.min(1, Math.max(0, t));
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i];
      return [
        lerp(polyline[i][0], polyline[i + 1][0], f),
        lerp(polyline[i][1], polyline[i + 1][1], f),
      ];
    }
    target -= segLens[i];
  }
  return polyline[polyline.length - 1];
}

// ─── Named anchors ───────────────────────────────────────────────────────────

export const HOME: [number, number] = [28.4765, 77.0765]; // Sector 29, Gurugram
export const CYBER_HUB: [number, number] = [28.4947, 77.0894];
export const CITY_CENTER: [number, number] = [28.4595, 77.0266]; // spec example coords

export const AREA_LABEL = { area: 'Gurugram', state: 'Haryana' };
