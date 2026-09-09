import type {
  AppNotification,
  Hazard,
  HazardType,
  Journey,
  Observation,
  RepairCase,
  RoadSegment,
  RouteOption,
  Severity,
} from '../types';
import { evidenceUrl } from './evidence';
import { minutesAgo, daysAgo, pointAlong, seededRng, HOME, CYBER_HUB, CITY_CENTER } from './geoBase';
import { ROADS } from './roads';

/**
 * Seed dataset — ~40 hazards across Gurugram, generated deterministically.
 * PH-1024 (the demo centerpiece) is hand-authored to match the spec exactly.
 */

const OBS_VEHICLES = [
  'Vehicle #A72',
  'Vehicle #F18',
  'Vehicle #C92',
  'Vehicle #B04',
  'Vehicle #D37',
  'Vehicle #E55',
  'Vehicle #G61',
  'Vehicle #H88',
];

function obs(vehicleId: string, minutesBack: number, matched: boolean): Observation {
  return { vehicleId, detectedAt: minutesAgo(minutesBack), matched };
}

/** Weighted hazard mix so the map reads like a real city. */
const MIX: Array<{ type: HazardType; severity: Severity; weight: number }> = [
  { type: 'pothole', severity: 'critical', weight: 4 },
  { type: 'pothole', severity: 'high', weight: 9 },
  { type: 'pothole', severity: 'moderate', weight: 12 },
  { type: 'pothole', severity: 'low', weight: 7 },
  { type: 'waterlogging', severity: 'high', weight: 5 },
  { type: 'waterlogging', severity: 'moderate', weight: 4 },
  { type: 'open_manhole', severity: 'critical', weight: 2 },
  { type: 'debris', severity: 'moderate', weight: 5 },
  { type: 'damaged_road', severity: 'high', weight: 4 },
  { type: 'damaged_road', severity: 'moderate', weight: 4 },
  { type: 'broken_speed_breaker', severity: 'moderate', weight: 3 },
  { type: 'other', severity: 'low', weight: 3 },
];
const TOTAL_WEIGHT = MIX.reduce((s, m) => s + m.weight, 0);

const TYPE_DESC: Record<HazardType, string> = {
  pothole: 'Road surface break with loose fragments',
  waterlogging: 'Standing water covering part of the carriageway',
  open_manhole: 'Uncovered utility opening on the road',
  debris: 'Loose material on the carriageway',
  damaged_road: 'Cracked or broken surface section',
  broken_speed_breaker: 'Speed breaker with missing/broken sections',
  other: 'Unclassified road defect',
};

const CONF_FOR_SEVERITY: Record<Severity, [number, number]> = {
  low: [72, 85],
  moderate: [80, 90],
  high: [88, 96],
  critical: [93, 98],
};

const RISK_FOR_SEVERITY: Record<Severity, [number, number]> = {
  low: [18, 34],
  moderate: [36, 55],
  high: [60, 84],
  critical: [85, 97],
};

function pickWeighted(r: number): (typeof MIX)[number] {
  let acc = 0;
  for (const m of MIX) {
    acc += m.weight / TOTAL_WEIGHT;
    if (r <= acc) return m;
  }
  return MIX[0];
}

/** Statuses reflecting a realistic operating pipeline. */
function statusForSeverity(sev: Severity, r: number): Hazard['status'] {
  if (sev === 'low') return r < 0.5 ? 'provisional' : 'verified';
  if (sev === 'moderate') return r < 0.15 ? 'provisional' : 'verified';
  if (sev === 'high') return r < 0.25 ? 'provisional' : r < 0.75 ? 'verified' : r < 0.9 ? 'assigned' : 'under_repair';
  // critical
  return r < 0.1 ? 'provisional' : r < 0.45 ? 'verified' : r < 0.8 ? 'assigned' : 'under_repair';
}

/** Generate the demo hazard set deterministically. */
function buildHazards(): Hazard[] {
  const list: Hazard[] = [];
  const rng = seededRng(20260909);

  // Hand-authored centerpiece hazard — exact spec values.
  const ph1024: Hazard = {
    id: 'PH-1024',
    type: 'pothole',
    roadName: 'MG Road',
    segmentId: 'rd-mg',
    latitude: CITY_CENTER[0],
    longitude: CITY_CENTER[1],
    severity: 'high',
    confidence: 94,
    riskScore: 84,
    confirmationCount: 7,
    firstDetected: minutesAgo(84),
    lastDetected: minutesAgo(2),
    status: 'verified',
    affectedWidthM: 0.8,
    description: TYPE_DESC.pothole,
    observations: [
      obs('Vehicle #A72', 84, false),
      obs('Vehicle #F18', 78, true),
      obs('Vehicle #C92', 73, true),
      obs('Vehicle #B04', 56, true),
      obs('Vehicle #D37', 41, true),
      obs('Vehicle #G61', 18, true),
      obs('Vehicle #E55', 2, true),
    ],
    timeline: [
      { at: minutesAgo(84), label: 'First detected by Vehicle #A72' },
      { at: minutesAgo(78), label: 'Matched by Vehicle #F18 — provisional → 2 detections' },
      { at: minutesAgo(73), label: 'Vehicle #C92 confirmed — 3 detections, status Verified' },
      { at: minutesAgo(56), label: 'Vehicle #B04 confirmed' },
      { at: minutesAgo(41), label: 'Vehicle #D37 confirmed' },
      { at: minutesAgo(18), label: 'Vehicle #G61 confirmed' },
      { at: minutesAgo(2), label: 'Vehicle #E55 confirmed — 7 independent detections' },
    ],
    evidenceImage: evidenceUrl('pothole', 'high', 'PH-1024'),
  };

  const mk = (n: number): Hazard => {
    const road = ROADS[Math.floor(rng() * ROADS.length)];
    const t = rng();
    const along = pointAlong(road.polyline, t);
    const jitter = (rng() - 0.5) * 0.004;
    const pick = pickWeighted(rng());
    const sev = pick.severity;
    const [cLo, cHi] = CONF_FOR_SEVERITY[sev];
    const [rLo, rHi] = RISK_FOR_SEVERITY[sev];
    const confidence = Math.round(cLo + rng() * (cHi - cLo));
    const riskScore = Math.round(rLo + rng() * (rHi - rLo));
    const confCount =
      sev === 'low' ? 1 + Math.floor(rng() * 2) : sev === 'moderate' ? 2 + Math.floor(rng() * 3) : 4 + Math.floor(rng() * 6);
    const ageMin = 10 + Math.floor(rng() * 2870);
    const status = statusForSeverity(sev, rng());
    const observations: Observation[] = [];
    for (let i = 0; i < Math.min(confCount, 4); i++) {
      observations.push(obs(OBS_VEHICLES[Math.floor(rng() * OBS_VEHICLES.length)], ageMin - i * (3 + Math.floor(rng() * 9)), i > 0));
    }
    return {
      id: `${pick.type === 'pothole' ? 'PH' : pick.type === 'waterlogging' ? 'WL' : 'RD'}-${1000 + n}`,
      type: pick.type,
      roadName: road.name,
      segmentId: road.id,
      latitude: along[0] + jitter,
      longitude: along[1] + jitter,
      severity: sev,
      confidence,
      riskScore,
      confirmationCount: confCount,
      firstDetected: minutesAgo(ageMin),
      lastDetected: minutesAgo(Math.max(1, ageMin - confCount * 4)),
      status,
      affectedWidthM: pick.type === 'pothole' ? 0.3 + Math.round(rng() * 12) / 10 : undefined,
      description: TYPE_DESC[pick.type],
      observations,
      timeline: [
        { at: minutesAgo(ageMin), label: `First detected on ${road.name}` },
        ...(confCount >= 3
          ? [{ at: minutesAgo(Math.max(2, ageMin - 6)), label: `${confCount} independent detections — status Verified` }]
          : []),
      ],
      evidenceImage: evidenceUrl(pick.type, sev, `${pick.type === 'pothole' ? 'PH' : 'RD'}-${1000 + n}`),
    };
  };

  for (let n = 1; n <= 42; n++) list.push(mk(n));
  // Insert centerpiece last (id ordering irrelevant).
  list.push(ph1024);
  return list;
}

export const SEED_HAZARDS: Hazard[] = buildHazards();

// ─── Repairs ────────────────────────────────────────────────────────────────

export const SEED_REPAIRS: RepairCase[] = [
  {
    id: 'RC-2381',
    hazardId: 'PH-1024',
    assignedDepartment: 'Road Maintenance Division',
    assignedAt: daysAgo(0, -120),
    expectedCompletion: daysAgo(-3, 120),
    status: 'unassigned',
    notes: [{ at: daysAgo(0, -120), author: 'Ops', text: 'Case opened from verified hazard PH-1024.' }],
  },
  {
    id: 'RC-2294',
    hazardId: 'PH-1003',
    assignedDepartment: 'Road Maintenance Division',
    assignedAt: daysAgo(2),
    repairedAt: daysAgo(0, -160),
    expectedCompletion: daysAgo(0),
    status: 'verification_pending',
    verificationPasses: [],
    notes: [{ at: daysAgo(0, -160), author: 'Road Maintenance Division', text: 'Pothole filled with hot mix; curing period ends tomorrow.' }],
  },
  {
    id: 'RC-2210',
    hazardId: 'WL-1012',
    assignedDepartment: 'Drainage Cell',
    assignedAt: daysAgo(5),
    repairedAt: daysAgo(3),
    status: 'verified',
    verificationConfidence: 93,
    verificationPasses: [
      { vehicleId: 'Vehicle #A72', at: daysAgo(2, -30), defectDetected: false },
      { vehicleId: 'Vehicle #F18', at: daysAgo(2, -20), defectDetected: false },
      { vehicleId: 'Vehicle #C92', at: daysAgo(2, -10), defectDetected: false },
      { vehicleId: 'Vehicle #B04', at: daysAgo(1, -300), defectDetected: false },
      { vehicleId: 'Vehicle #E55', at: daysAgo(1, -240), defectDetected: false },
    ],
    notes: [
      { at: daysAgo(3), author: 'Drainage Cell', text: 'Drain cleared and road re-laid.' },
      { at: daysAgo(1, -240), author: 'System', text: '5 independent passes detected no defect — repair verified (93%).' },
    ],
  },
  {
    id: 'RC-2155',
    hazardId: 'PH-1018',
    assignedDepartment: 'Road Maintenance Division',
    assignedAt: daysAgo(8),
    repairedAt: daysAgo(4),
    status: 'failed',
    verificationConfidence: 76,
    verificationPasses: [
      { vehicleId: 'Vehicle #A72', at: daysAgo(3), defectDetected: false },
      { vehicleId: 'Vehicle #F18', at: daysAgo(2, -400), defectDetected: false },
      { vehicleId: 'Vehicle #C92', at: daysAgo(2, -390), defectDetected: true },
    ],
    notes: [
      { at: daysAgo(4), author: 'Road Maintenance Division', text: 'Surface patch applied.' },
      { at: daysAgo(2, -390), author: 'System', text: 'Vehicle #C92 still detected the defect — verification failed (76%).' },
    ],
  },
];

// ─── Road segments (derived, not stored) ────────────────────────────────────

export function seedRoadSegments(hazards: Hazard[]): RoadSegment[] {
  return ROADS.map((road) => {
    const active = hazards.filter(
      (h) => h.segmentId === road.id && !['repaired', 'verification_pending', 'verified'].includes(h.status),
    );
    return {
      id: road.id,
      name: road.name,
      polyline: road.polyline,
      hazardCount: active.length,
      severity: active.some((h) => h.severity === 'critical')
        ? 'critical'
        : active.some((h) => h.severity === 'high')
          ? 'high'
          : active.some((h) => h.severity === 'moderate')
            ? 'moderate'
            : 'low',
      trafficLevel: road.trafficLevel,
      driveabilityScore: 100, // replaced by engine at runtime
      lengthKm: Math.max(0.5, Math.round((road.polyline.length * 0.35) * 10) / 10),
    };
  });
}

// ─── Routes (mock routing — Home → Cyber Hub, as in the spec) ───────────────

export function seedRoutes(hazards: Hazard[]): RouteOption[] {
  const near = (poly: [number, number][]) =>
    hazards.filter(
      (h) =>
        !['repaired', 'verification_pending', 'verified'].includes(h.status) &&
        poly.some((v) => Math.hypot(h.latitude - v[0], h.longitude - v[1]) < 0.012),
    );

  const fastestPoly: [number, number][] = [
    [28.4765, 77.0765],
    [28.4806, 77.0818],
    [28.487, 77.088],
    [28.4947, 77.0894],
  ];
  const recommendedPoly: [number, number][] = [
    [28.4765, 77.0765],
    [28.4769, 77.0828],
    [28.4782, 77.0915],
    [28.4838, 77.0941],
    [28.4894, 77.0942],
    [28.4947, 77.0894],
  ];
  const alternativePoly: [number, number][] = [
    [28.4765, 77.0765],
    [28.4702, 77.0693],
    [28.4688, 77.0607],
    [28.4703, 77.0504],
    [28.4775, 77.0483],
    [28.4855, 77.0551],
    [28.4912, 77.0709],
    [28.4947, 77.0894],
  ];

  const fast = near(fastestPoly);
  const rec = near(recommendedPoly);
  const alt = near(alternativePoly);

  const count = (arr: Hazard[], s: Severity) => arr.filter((h) => h.severity === s).length;

  return [
    {
      id: 'fastest',
      label: 'Fastest',
      durationMin: 18,
      distanceKm: 12.4,
      driveability: 51,
      hazardCount: fast.length,
      criticalHazards: count(fast, 'critical') + count(fast, 'high'),
      reasons: ['Shortest time to destination', `${fast.length} hazards on this corridor`, 'Runs along NH-48 service lanes'],
      polyline: fastestPoly,
      segments: [
        { name: 'NH-48 service road', condition: 'high_risk', driveability: 44 },
        { name: 'Sector 29 crossing', condition: 'moderate', driveability: 68 },
      ],
    },
    {
      id: 'recommended',
      label: 'Recommended',
      durationMin: 21,
      distanceKm: 13.1,
      driveability: 89,
      hazardCount: rec.length,
      criticalHazards: 0,
      recommended: true,
      reasons: [
        'No critical hazards',
        'Better road surface throughout',
        'Lower vehicle-specific risk',
        'Only 3 minutes slower than fastest',
      ],
      polyline: recommendedPoly,
      segments: [
        { name: 'Golf Course Road', condition: 'good', driveability: 91 },
        { name: 'Sector 56/57 Roads', condition: 'good', driveability: 88 },
      ],
    },
    {
      id: 'alternative',
      label: 'Alternative',
      durationMin: 24,
      distanceKm: 14.2,
      driveability: 74,
      hazardCount: alt.length,
      criticalHazards: count(alt, 'critical'),
      reasons: ['Useful when NH-48 is congested', 'Moderate surface quality on Sohna Road'],
      polyline: alternativePoly,
      segments: [
        { name: 'Sohna Road', condition: 'moderate', driveability: 72 },
        { name: 'Old Delhi Road', condition: 'moderate', driveability: 76 },
      ],
    },
  ];
}

export const SEED_JOURNEYS: Journey[] = [
  {
    id: 'j-today',
    from: 'Home',
    to: 'Cyber Hub',
    date: minutesAgo(150),
    durationMin: 21,
    distanceKm: 13.1,
    driveability: 89,
    hazardsEncountered: 0,
  },
  {
    id: 'j-1',
    from: 'Home',
    to: 'Cyber Hub',
    date: daysAgo(0, -200),
    durationMin: 21,
    distanceKm: 13.1,
    driveability: 89,
    hazardsEncountered: 1,
  },
  {
    id: 'j-2',
    from: 'Home',
    to: 'College',
    date: daysAgo(1),
    durationMin: 28,
    distanceKm: 9.6,
    driveability: 73,
    hazardsEncountered: 3,
  },
  {
    id: 'j-3',
    from: 'Home',
    to: 'Railway Station',
    date: daysAgo(3),
    durationMin: 34,
    distanceKm: 15.4,
    driveability: 64,
    hazardsEncountered: 4,
  },
  {
    id: 'j-4',
    from: 'Cyber Hub',
    to: 'Home',
    date: daysAgo(4),
    durationMin: 22,
    distanceKm: 13.3,
    driveability: 82,
    hazardsEncountered: 2,
  },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    audience: 'user',
    title: 'Severe hazard detected ahead',
    body: 'Pothole PH-1024 on MG Road — 120 m ahead on your route.',
    createdAt: minutesAgo(2),
    read: false,
    kind: 'hazard',
  },
  {
    id: 'n-2',
    audience: 'user',
    title: 'Road condition improved',
    body: 'Waterlogging on Golf Course Road has been cleared and verified.',
    createdAt: minutesAgo(55),
    read: false,
    kind: 'route',
  },
  {
    id: 'n-3',
    audience: 'user',
    title: 'Your hazard report was confirmed',
    body: 'Debris on Sohna Road — confirmed by 3 independent vehicles.',
    createdAt: daysAgo(0, -180),
    read: true,
    kind: 'report',
  },
  {
    id: 'n-4',
    audience: 'admin',
    title: 'Repair verification failed',
    body: 'RC-2155 (PH-1018): independent pass still detected the defect.',
    createdAt: daysAgo(2, -390),
    read: false,
    kind: 'repair',
  },
  {
    id: 'n-5',
    audience: 'admin',
    title: 'Critical hazard cluster forming',
    body: 'NH-48 — 4 critical detections within 500 m in the last hour.',
    createdAt: minutesAgo(12),
    read: false,
    kind: 'hazard',
  },
  {
    id: 'n-6',
    audience: 'admin',
    title: 'Repair verified',
    body: 'RC-2210 (WL-1012): 5 independent passes, no defect detected.',
    createdAt: daysAgo(1, -240),
    read: true,
    kind: 'repair',
  },
];

export { HOME, CYBER_HUB };
