/** Geospatial helpers (mock-tier accuracy is fine — no fake precision). */

export function haversineM(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function polylineLengthM(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineM(points[i - 1], points[i]);
  return total;
}

/** Distance from a point to the closest vertex of a polyline (metres). */
export function distanceToPolylineM(
  p: [number, number],
  line: [number, number][],
): number {
  let best = Infinity;
  for (const v of line) best = Math.min(best, haversineM(p, v));
  return best;
}

export function formatDistance(metres: number): string {
  if (metres < 950) return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Total polyline length in km, rounded to 1 decimal. */
export function polylineKm(points: [number, number][]): number {
  return Math.round((polylineLengthM(points) / 1000) * 10) / 10;
}
