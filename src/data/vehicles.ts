import type { Vehicle, VehicleClassInfo, VehicleType, Contributor } from '../types';
import { minutesAgo } from './geoBase';

/** Physical/behavioural profile per vehicle class (mock, explainable). */
export const VEHICLE_CLASSES: VehicleClassInfo[] = [
  { type: 'motorcycle', label: 'Motorcycle', typicalClearanceMm: 140, defectSensitivity: 1.45, waterloggingSensitivity: 1.5 },
  { type: 'scooter', label: 'Scooter', typicalClearanceMm: 120, defectSensitivity: 1.55, waterloggingSensitivity: 1.55 },
  { type: 'hatchback', label: 'Hatchback', typicalClearanceMm: 155, defectSensitivity: 1.15, waterloggingSensitivity: 1.1 },
  { type: 'sedan', label: 'Sedan', typicalClearanceMm: 165, defectSensitivity: 1.0, waterloggingSensitivity: 1.0 },
  { type: 'suv', label: 'SUV', typicalClearanceMm: 210, defectSensitivity: 0.62, waterloggingSensitivity: 0.5 },
  { type: 'bus', label: 'Bus', typicalClearanceMm: 260, defectSensitivity: 0.8, waterloggingSensitivity: 0.85 },
  { type: 'emergency', label: 'Emergency Vehicle', typicalClearanceMm: 190, defectSensitivity: 1.15, waterloggingSensitivity: 1.1 },
];

export const VEHICLE_CLASS_BY_TYPE: Record<VehicleType, VehicleClassInfo> =
  Object.fromEntries(VEHICLE_CLASSES.map((c) => [c.type, c])) as Record<
    VehicleType,
    VehicleClassInfo
  >;

/** The demo user's vehicle. */
export const MY_VEHICLE: Vehicle = {
  id: 'veh-001',
  type: 'sedan',
  name: 'Honda City',
  model: '2022 Honda City VX',
  groundClearanceMm: 165,
  sensitivity: 'medium',
};

/** Anonymous contributor fleet — proves crowdsourcing without exposing people. */
export const CONTRIBUTORS: Contributor[] = [
  { vehicleId: 'Vehicle #A72', vehicleClass: 'sedan', observations: 342, confirmations: 318, reliability: 96, lastActive: minutesAgo(4) },
  { vehicleId: 'Vehicle #F18', vehicleClass: 'motorcycle', observations: 291, confirmations: 260, reliability: 93, lastActive: minutesAgo(3) },
  { vehicleId: 'Vehicle #C92', vehicleClass: 'suv', observations: 274, confirmations: 251, reliability: 95, lastActive: minutesAgo(1) },
  { vehicleId: 'Vehicle #B04', vehicleClass: 'bus', observations: 198, confirmations: 190, reliability: 91, lastActive: minutesAgo(9) },
  { vehicleId: 'Vehicle #D37', vehicleClass: 'hatchback', observations: 156, confirmations: 140, reliability: 89, lastActive: minutesAgo(14) },
  { vehicleId: 'Vehicle #E55', vehicleClass: 'scooter', observations: 132, confirmations: 117, reliability: 92, lastActive: minutesAgo(6) },
  { vehicleId: 'Vehicle #G61', vehicleClass: 'sedan', observations: 121, confirmations: 109, reliability: 94, lastActive: minutesAgo(11) },
  { vehicleId: 'Vehicle #H88', vehicleClass: 'emergency', observations: 98, confirmations: 95, reliability: 97, lastActive: minutesAgo(21) },
];
