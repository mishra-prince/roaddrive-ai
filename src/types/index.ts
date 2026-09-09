// ─── Core domain model (shared by User and Admin interfaces) ────────────────

export type HazardType =
  | 'pothole'
  | 'waterlogging'
  | 'open_manhole'
  | 'debris'
  | 'damaged_road'
  | 'broken_speed_breaker'
  | 'other';

export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export type HazardStatus =
  | 'provisional'
  | 'verified'
  | 'assigned'
  | 'under_repair'
  | 'repaired'
  | 'verification_pending'
  | 'verification_failed';

export interface Observation {
  /** Anonymous vehicle identifier — no personal information. */
  vehicleId: string;
  detectedAt: string;
  /** True when this observation matched an already-known hazard. */
  matched: boolean;
}

export interface TimelineEvent {
  at: string;
  label: string;
}

export interface Hazard {
  id: string;
  type: HazardType;
  roadName: string;
  segmentId: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  /** AI confidence, 0–100 */
  confidence: number;
  /** Risk score, 0–100 */
  riskScore: number;
  confirmationCount: number;
  firstDetected: string;
  lastDetected: string;
  status: HazardStatus;
  /** Estimated affected width in metres (approximate — no fake precision). */
  affectedWidthM?: number;
  description: string;
  observations: Observation[];
  timeline: TimelineEvent[];
  evidenceImage?: string;
}

// ─── Vehicles ───────────────────────────────────────────────────────────────

export type VehicleType =
  | 'motorcycle'
  | 'scooter'
  | 'hatchback'
  | 'sedan'
  | 'suv'
  | 'bus'
  | 'emergency';

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  model?: string;
  groundClearanceMm?: number;
  sensitivity?: 'low' | 'medium' | 'high';
}

/** Static class-level info used to compute vehicle-specific driveability. */
export interface VehicleClassInfo {
  type: VehicleType;
  label: string;
  typicalClearanceMm: number;
  /** How strongly this class is punished by road defects (higher = more). */
  defectSensitivity: number;
  waterloggingSensitivity: number;
}

// ─── Roads ──────────────────────────────────────────────────────────────────

export type TrafficLevel = 'low' | 'moderate' | 'high';

export interface RoadSegment {
  id: string;
  name: string;
  /** Ordered [lat, lng] polyline. */
  polyline: [number, number][];
  driveabilityScore: number;
  hazardCount: number;
  severity: Severity;
  trafficLevel: TrafficLevel;
  lengthKm: number;
}

export type SegmentCondition = 'good' | 'moderate' | 'poor' | 'high_risk';

export interface RouteSegmentState {
  name: string;
  condition: SegmentCondition;
  driveability: number;
}

export interface RouteOption {
  id: string;
  label: string;
  durationMin: number;
  distanceKm: number;
  driveability: number;
  hazardCount: number;
  criticalHazards: number;
  /** Human-readable reasons this route was (or wasn't) recommended. */
  reasons: string[];
  recommended?: boolean;
  polyline: [number, number][];
  segments: RouteSegmentState[];
}

// ─── Repairs ────────────────────────────────────────────────────────────────

export type RepairStatus =
  | 'unassigned'
  | 'assigned'
  | 'under_repair'
  | 'repaired'
  | 'verification_pending'
  | 'verified'
  | 'failed';

export interface VerificationPass {
  vehicleId: string;
  at: string;
  defectDetected: boolean;
}

export interface RepairNote {
  at: string;
  author: string;
  text: string;
}

export interface RepairCase {
  id: string;
  hazardId: string;
  assignedDepartment?: string;
  assignedAt?: string;
  repairedAt?: string;
  expectedCompletion?: string;
  status: RepairStatus;
  verificationPasses?: VerificationPass[];
  verificationConfidence?: number;
  notes: RepairNote[];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  audience: 'user' | 'admin';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: 'hazard' | 'route' | 'repair' | 'report' | 'system';
}

// ─── Journeys / contributors ─────────────────────────────────────────────────

export interface Journey {
  id: string;
  from: string;
  to: string;
  date: string;
  durationMin: number;
  distanceKm: number;
  driveability: number;
  hazardsEncountered: number;
}

export interface Contributor {
  vehicleId: string;
  vehicleClass: VehicleType;
  observations: number;
  confirmations: number;
  reliability: number;
  lastActive: string;
}

/** Seeded platform-level stats (clearly demo data). */
export interface PlatformStats {
  averageRepairDays: number;
  verifiedRepairRate: number;
  reportsToday: number;
}
