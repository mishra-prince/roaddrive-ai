import type { TrafficLevel } from '../types';

/**
 * Road network (mock, Gurugram). Driveability scores are NOT stored here —
 * they are derived at runtime from active hazards + traffic (see
 * utils/driveability.ts) so scores stay consistent as the demo state changes.
 */
export interface RoadDef {
  id: string;
  name: string;
  polyline: [number, number][];
  trafficLevel: TrafficLevel;
  /** Base surface quality (0–100) before hazard penalties — older roads sit lower. */
  surfaceBase: number;
  zone: string;
}

export const ROADS: RoadDef[] = [
  {
    id: 'rd-mg',
    name: 'MG Road',
    polyline: [
      [28.4835, 77.0700],
      [28.4806, 77.0745],
      [28.4782, 77.0782],
      [28.4758, 77.0818],
      [28.473, 77.085],
      [28.47, 77.087],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'Central',
  },
  {
    id: 'rd-gcr',
    name: 'Golf Course Road',
    polyline: [
      [28.458, 77.093],
      [28.449, 77.0975],
      [28.44, 77.099],
      [28.43, 77.0985],
      [28.42, 77.096],
      [28.412, 77.092],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'South-East',
  },
  {
    id: 'rd-nh48',
    name: 'NH-48',
    polyline: [
      [28.502, 77.095],
      [28.495, 77.088],
      [28.487, 77.08],
      [28.479, 77.07],
      [28.472, 77.057],
      [28.468, 77.045],
      [28.462, 77.03],
      [28.454, 77.013],
      [28.446, 76.998],
    ],
    trafficLevel: 'high',
    surfaceBase: 100,
    zone: 'Corridor',
  },
  {
    id: 'rd-sohna',
    name: 'Sohna Road',
    polyline: [
      [28.417, 77.055],
      [28.408, 77.058],
      [28.398, 77.0585],
      [28.388, 77.06],
      [28.377, 77.063],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'South',
  },
  {
    id: 'rd-olddelhi',
    name: 'Old Delhi Road',
    polyline: [
      [28.47, 77.029],
      [28.463, 77.021],
      [28.455, 77.014],
      [28.447, 77.007],
    ],
    trafficLevel: 'low',
    surfaceBase: 91,
    zone: 'Old Gurgaon',
  },
  {
    id: 'rd-gcext',
    name: 'Golf Course Extension Rd',
    polyline: [
      [28.412, 77.092],
      [28.405, 77.083],
      [28.4, 77.073],
      [28.396, 77.064],
    ],
    trafficLevel: 'low',
    surfaceBase: 100,
    zone: 'South-East',
  },
  {
    id: 'rd-s29',
    name: 'Sector 29 Roads',
    polyline: [
      [28.468, 77.069],
      [28.469, 77.076],
      [28.47, 77.082],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'Central',
  },
  {
    id: 'rd-s56',
    name: 'Sector 56/57 Roads',
    polyline: [
      [28.424, 77.092],
      [28.429, 77.09],
      [28.434, 77.089],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'South-East',
  },
  {
    id: 'rd-cybercity',
    name: 'Cyber City',
    polyline: [
      [28.496, 77.085],
      [28.4947, 77.0894],
      [28.493, 77.092],
    ],
    trafficLevel: 'moderate',
    surfaceBase: 100,
    zone: 'North',
  },
];

export const ROAD_BY_ID = Object.fromEntries(ROADS.map((r) => [r.id, r]));
