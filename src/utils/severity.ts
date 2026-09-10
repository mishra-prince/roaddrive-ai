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
    hex: '#22C55E',
    chip: 'bg-green-500/10 text-green-300 border-green-500/30',
    text: 'text-green-300',
    bar: 'bg-severity-low',
  },
  moderate: {
    label: 'Moderate',
    hex: '#EAB308',
    chip: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40',
    text: 'text-yellow-300',
    bar: 'bg-severity-moderate',
  },
  high: {
    label: 'High',
    hex: '#F97316',
    chip: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    text: 'text-orange-300',
    bar: 'bg-severity-high',
  },
  critical: {
    label: 'Critical',
    hex: '#EF4444',
    chip: 'bg-red-500/10 text-red-300 border-red-500/30',
    text: 'text-red-300',
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
  provisional: { label: 'Provisional', chip: 'bg-soft-strong text-ink-soft border-line' },
  verified: { label: 'Verified', chip: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  assigned: { label: 'Assigned', chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  under_repair: { label: 'Under Repair', chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  repaired: { label: 'Repaired', chip: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
  verification_pending: {
    label: 'Verification Pending',
    chip: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  verification_failed: {
    label: 'Verification Failed',
    chip: 'bg-red-500/10 text-red-300 border-red-500/30',
  },
};

export const REPAIR_STATUS_META: Record<
  RepairStatus,
  { label: string; chip: string }
> = {
  unassigned: { label: 'Unassigned', chip: 'bg-soft-strong text-ink-soft border-line' },
  assigned: { label: 'Assigned', chip: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  under_repair: { label: 'Under Repair', chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  repaired: { label: 'Repaired', chip: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
  verification_pending: {
    label: 'Verification Pending',
    chip: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  verified: { label: 'Verified', chip: 'bg-green-500/10 text-green-300 border-green-500/30' },
  failed: { label: 'Failed', chip: 'bg-red-500/10 text-red-300 border-red-500/30' },
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
  good: { label: 'Good', hex: '#22C55E', text: 'text-green-300' },
  moderate: { label: 'Moderate', hex: '#EAB308', text: 'text-yellow-300' },
  poor: { label: 'Poor', hex: '#F97316', text: 'text-orange-300' },
  high_risk: { label: 'High Risk', hex: '#EF4444', text: 'text-red-300' },
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
  if (score >= 85) return { label: 'Good conditions', text: 'text-green-300' };
  if (score >= 65) return { label: 'Moderate conditions', text: 'text-yellow-300' };
  if (score >= 45) return { label: 'Poor conditions', text: 'text-orange-300' };
  return { label: 'High risk conditions', text: 'text-red-300' };
}
