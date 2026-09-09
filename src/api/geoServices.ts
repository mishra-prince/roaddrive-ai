/**
 * Location services — Nominatim (search) + OSRM (routing), both free and
 * key-less with polite usage. If either service is unreachable, callers get
 * `null` and the UI falls back to the built-in demo POIs/routes, so the demo
 * never breaks offline.
 */

export interface Place {
  name: string;
  detail?: string;
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OSRM = 'https://router.project-osrm.org';

/** Search places worldwide (used by the user map search box). */
export async function searchPlaces(q: string, near?: { lat: number; lng: number }): Promise<Place[]> {
  if (!q.trim()) return [];
  try {
    const url = new URL(`${NOMINATIM}/search`);
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', 6);
    url.searchParams.set('addressdetails', '1');
    if (near) {
      // bias results to the map area
      const d = 2.5;
      url.searchParams.set('viewbox', `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
      url.searchParams.set('bounded', '0');
    }
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return rows.map((r) => ({
      name: r.name || (r.display_name || '').split(',')[0],
      detail: (r.display_name || '').split(',').slice(1, 3).join(', ').trim(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

/** Reverse geocode a coordinate to a readable label. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=16`);
    if (!res.ok) return null;
    const r = await res.json();
    return r.display_name ?? null;
  } catch {
    return null;
  }
}

export interface Directions {
  /** [lat, lng] polyline from OSRM */
  polyline: [number, number][];
  distanceKm: number;
  durationMin: number;
}

/** Driving directions between two points (OSRM public demo server). */
export async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<Directions | null> {
  try {
    const res = await fetch(`${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const r = await res.json();
    const route = r.routes?.[0];
    if (!route) return null;
    const polyline: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    return {
      polyline,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  }
}
