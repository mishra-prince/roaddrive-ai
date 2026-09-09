import type { Hazard, RoadSegment, Severity, Vehicle, VehicleType } from '../types';
import { VEHICLE_CLASS_BY_TYPE } from '../data/vehicles';
import { SEVERITY_PENALTY, TRAFFIC_PENALTY } from './severity';

/**
 * Driveability engine — deterministic and explainable.
 *
 * Segment score = surface base − Σ severity penalties of active hazards − traffic penalty.
 * Vehicle-specific score applies the class sensitivity multiplier to the hazard penalty
 * (never below 0, capped at 100). Waterlogging hits low-clearance classes harder.
 */

const STATUS_ACTIVE = new Set(['provisional', 'verified', 'assigned', 'under_repair', 'verification_failed']);

export function hazardsOnSegment(hazards: Hazard[], segmentId: string): Hazard[] {
  return hazards.filter((h) => h.segmentId === segmentId && STATUS_ACTIVE.has(h.status));
}

export function segmentDriveability(
  base: number,
  hazards: Hazard[],
  traffic: 'low' | 'moderate' | 'high',
): number {
  let penalty = 0;
  for (const h of hazards) {
    const mult = h.type === 'waterlogging' ? 0.85 : 1;
    penalty += SEVERITY_PENALTY[h.severity] * mult;
  }
  penalty += TRAFFIC_PENALTY[traffic];
  return clamp(base - penalty);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Compute a road segment's driveability for the given hazard snapshot. */
export function computeSegment(base: number, traffic: 'low' | 'moderate' | 'high', hazards: Hazard[]): number {
  return segmentDriveability(base, hazards, traffic);
}

/** Overall area score = average of segment scores (the "82/100" home screen). */
export function areaDriveability(segments: RoadSegment[]): number {
  if (segments.length === 0) return 0;
  return Math.round(segments.reduce((s, r) => s + r.driveabilityScore, 0) / segments.length);
}

/** Nearest active hazard to a point, with distance in metres. */
export function nearestHazard(
  hazards: Hazard[],
  point: [number, number],
): { hazard: Hazard; distanceM: number } | null {
  let best: { hazard: Hazard; distanceM: number } | null = null;
  for (const h of hazards) {
    if (!STATUS_ACTIVE.has(h.status)) continue;
    const d = Math.hypot(
      (h.latitude - point[0]) * 111320,
      (h.longitude - point[1]) * 111320 * Math.cos((point[0] * Math.PI) / 180),
    );
    if (!best || d < best.distanceM) best = { hazard: h, distanceM: d };
  }
  return best;
}

// ─── Vehicle-specific driveability ──────────────────────────────────────────

export interface VehicleScore {
  vehicleType: VehicleType;
  label: string;
  score: number;
  verdict: 'unsuitable' | 'caution' | 'suitable';
}

export function vehicleSpecificScore(
  segment: RoadSegment,
  vehicle: Vehicle | VehicleType,
): VehicleScore {
  const v = typeof vehicle === 'string' ? VEHICLE_CLASS_BY_TYPE[vehicle] : VEHICLE_CLASS_BY_TYPE[vehicle.type];
  const base = segment.driveabilityScore; // already hazard-adjusted for a sedan-class reference
  // Hazard penalty portion (100 - base) scaled by the class sensitivity.
  const penalty = (100 - base) * (v.defectSensitivity * 0.55 + v.waterloggingSensitivity * 0.45);
  const score = clamp(base - penalty * 0.9);
  return {
    vehicleType: v.type,
    label: v.label,
    score,
    verdict: score >= 75 ? 'suitable' : score >= 50 ? 'caution' : 'unsuitable',
  };
}

/** Why is this segment scored this way? (rule-based, no fake precision) */
export function segmentReasons(segment: RoadSegment, hazards: Hazard[]): string[] {
  const reasons: string[] = [];
  const sevCount = (s: Severity) => hazards.filter((h) => h.severity === s).length;
  const c = sevCount('critical'), hgh = sevCount('high'), m = sevCount('moderate'), w = hazards.filter((x) => x.type === 'waterlogging').length;
  if (c) reasons.push(`${c} severe ${c === 1 ? 'hazard' : 'hazards'}`);
  if (hgh) reasons.push(`${hgh} high-severity ${hgh === 1 ? 'defect' : 'defects'}`);
  if (m) reasons.push(`${m} moderate defects`);
  if (w) reasons.push('Waterlogging present');
  if (segment.trafficLevel === 'high') reasons.push('High traffic');
  else if (segment.trafficLevel === 'moderate') reasons.push('Moderate traffic');
  if (reasons.length === 0) reasons.push('Surface and traffic within normal range');
  return reasons;
}

export { STATUS_ACTIVE };
