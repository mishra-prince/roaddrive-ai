import type {
  Severity,
  HazardType,
  HazardStatus,
  RepairStatus,
  TrafficLevel,
  SegmentCondition,
  VehicleType,
} from '../types';

/** Tiny className joiner (no external dep). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ─── Severity ────────────────────────────────────────────────────────────────

export const SEVERITY_ORDER: Severity[] = ['low', 'moderate', 'high', 'critical'];

export const SEVERITY_META: Record<
  Severity,
  { label: string; hex: string; chip: string; text: string; bar: string }
> = {
  low: {
    label: 'Low',
    hex: '#16A34A',
    chip: 'bg-green-50 text-green-700 border-green-200',
    text: 'text-green-700',
    bar: 'bg-severity-low',
  },
  moderate: {
    label: 'Moderate',
    hex: '#CA8A04',
    chip: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    text: 'text-yellow-700',
    bar: 'bg-severity-moderate',
  },
  high: {
    label: 'High',
    hex: '#EA580C',
    chip: 'bg-orange-50 text-orange-700 border-orange-200',
    text: 'text-orange-700',
    bar: 'bg-severity-high',
  },
  critical: {
    label: 'Critical',
    hex: '#DC2626',
    chip: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    bar: 'bg-severity-critical',
  },
};

/** Penalty subtracted from a segment's driveability per active hazard. */
export const SEVERITY_PENALTY: Record<Severity, number> = {
  low: 1,
  moderate: 2,
  high: 4.5,
  critical: 8,
};

export const TRAFFIC_PENALTY: Record<TrafficLevel, number> = {
  low: 0,
  moderate: 3,
  high: 7,
};

// ─── Hazard types ────────────────────────────────────────────────────────────

export const HAZARD_TYPE_META: Record<HazardType, { label: string; plural: string }> = {
  pothole: { label: 'Pothole', plural: 'Potholes' },
  waterlogging: { label: 'Waterlogging', plural: 'Waterlogging' },
  open_manhole: { label: 'Open Manhole', plural: 'Open Manholes' },
  debris: { label: 'Debris', plural: 'Debris' },
  damaged_road: { label: 'Damaged Road', plural: 'Damaged Road' },
  broken_speed_breaker: { label: 'Broken Speed Breaker', plural: 'Broken Speed Breakers' },
  other: { label: 'Other Defect', plural: 'Other Defects' },
};

// ─── Hazard status ───────────────────────────────────────────────────────────

export const HAZARD_STATUS_META: Record<
  HazardStatus,
  { label: string; chip: string }
> = {
  provisional: { label: 'Provisional', chip: 'bg-gray-100 text-gray-700 border-gray-300' },
  verified: { label: 'Verified', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  assigned: { label: 'Assigned', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  under_repair: { label: 'Under Repair', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  repaired: { label: 'Repaired', chip: 'bg-teal-50 text-teal-700 border-teal-200' },
  verification_pending: {
    label: 'Verification Pending',
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  verification_failed: {
    label: 'Verification Failed',
    chip: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const REPAIR_STATUS_META: Record<
  RepairStatus,
  { label: string; chip: string }
> = {
  unassigned: { label: 'Unassigned', chip: 'bg-gray-100 text-gray-700 border-gray-300' },
  assigned: { label: 'Assigned', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  under_repair: { label: 'Under Repair', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  repaired: { label: 'Repaired', chip: 'bg-teal-50 text-teal-700 border-teal-200' },
  verification_pending: {
    label: 'Verification Pending',
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  verified: { label: 'Verified', chip: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', chip: 'bg-red-50 text-red-700 border-red-200' },
};

/** Ordered lifecycle steps for the repair stepper UI. */
export const REPAIR_LIFECYCLE: RepairStatus[] = [
  'unassigned',
  'assigned',
  'under_repair',
  'repaired',
  'verification_pending',
  'verified',
];

// ─── Vehicle classes ─────────────────────────────────────────────────────────

export const VEHICLE_CLASS_META: Record<VehicleType, string> = {
  motorcycle: 'Motorcycle',
  scooter: 'Scooter',
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  bus: 'Bus',
  emergency: 'Emergency Vehicle',
};

// ─── Road conditions ─────────────────────────────────────────────────────────

export const CONDITION_META: Record<
  SegmentCondition,
  { label: string; hex: string; text: string }
> = {
  good: { label: 'Good', hex: '#16A34A', text: 'text-green-700' },
  moderate: { label: 'Moderate', hex: '#CA8A04', text: 'text-yellow-700' },
  poor: { label: 'Poor', hex: '#EA580C', text: 'text-orange-700' },
  high_risk: { label: 'High Risk', hex: '#DC2626', text: 'text-red-700' },
};

export function conditionForScore(score: number): SegmentCondition {
  if (score >= 85) return 'good';
  if (score >= 65) return 'moderate';
  if (score >= 45) return 'poor';
  return 'high_risk';
}

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return fmtDateShort(iso);
}

export function isToday(iso: string): boolean {
  const a = new Date(iso);
  const b = new Date();
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function scoreTone(score: number): { label: string; text: string } {
  if (score >= 85) return { label: 'Good conditions', text: 'text-green-700' };
  if (score >= 65) return { label: 'Moderate conditions', text: 'text-yellow-700' };
  if (score >= 45) return { label: 'Poor conditions', text: 'text-orange-700' };
  return { label: 'High risk conditions', text: 'text-red-700' };
}
