import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppNotification,
  Hazard,
  HazardStatus,
  Journey,
  RepairCase,
  RepairStatus,
  RoadSegment,
  RouteOption,
  Vehicle,
} from '../types';
import { SEED_HAZARDS, SEED_REPAIRS, SEED_JOURNEYS, SEED_NOTIFICATIONS, seedRoadSegments, seedRoutes } from '../data/hazards';
import { ROADS } from '../data/roads';
import { MY_VEHICLE } from '../data/vehicles';
import { computeSegment, hazardsOnSegment } from '../utils/driveability';

/**
 * Global mock "backend" — a single React context holding the whole app state.
 * UI components never import seed data directly; everything flows through
 * api/* functions so a real backend can replace this file alone.
 */

export interface DriveEvent {
  id: string;
  at: string;
  title: string;
  detail: string;
}

export interface AppState {
  hazards: Hazard[];
  repairs: RepairCase[];
  segments: RoadSegment[];
  routes: RouteOption[];
  journeys: Journey[];
  notifications: AppNotification[];
  vehicle: Vehicle;
  driveLog: DriveEvent[];
  simulated: boolean; // any scenario mutation has run
}

function freshState(): AppState {
  const hazards = SEED_HAZARDS.map((h) => ({ ...h }));
  const segments = seedRoadSegments(hazards).map((seg) => {
    const road = ROADS.find((r) => r.id === seg.id)!;
    const on = hazardsOnSegment(hazards, seg.id);
    return { ...seg, driveabilityScore: computeSegment(road.surfaceBase, road.trafficLevel, on) };
  });
  return {
    hazards,
    repairs: SEED_REPAIRS.map((r) => ({ ...r })),
    segments,
    routes: seedRoutes(hazards),
    journeys: SEED_JOURNEYS.map((j) => ({ ...j })),
    notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
    vehicle: { ...MY_VEHICLE },
    driveLog: [],
    simulated: false,
  };
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(freshState);
  const [tick, setTick] = useState(0);

  // recompute derived road scores whenever hazards change
  useEffect(() => {
    setState((s) => ({
      ...s,
      segments: s.segments.map((seg) => {
        const road = ROADS.find((r) => r.id === seg.id)!;
        return { ...seg, driveabilityScore: computeSegment(road.surfaceBase, road.trafficLevel, hazardsOnSegment(s.hazards, seg.id)) };
      }),
    }));
  }, [state.hazards]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── core mutators ────────────────────────────────────────────────────────

  const now = () => new Date().toISOString();

  const patchHazard = useCallback((id: string, patch: Partial<Hazard>) => {
    setState((s) => ({
      ...s,
      hazards: s.hazards.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setState((s) => ({
      ...s,
      notifications: [
        { ...n, id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`, createdAt: now(), read: false },
        ...s.notifications,
      ].slice(0, 40),
    }));
  }, []);

  const pushDriveLog = useCallback((title: string, detail: string) => {
    setState((s) => ({
      ...s,
      driveLog: [...s.driveLog, { id: `e-${Date.now()}-${s.driveLog.length}`, at: now(), title, detail }].slice(-8),
    }));
  }, []);

  // ── public API (mirrors a future REST layer) ──────────────────────────────

  const api = useMemo(
    () => ({
      // reads
      getHazards: () => state.hazards,
      getHazardById: (id: string) => state.hazards.find((h) => h.id === id),
      getSegments: () => state.segments,
      getRoutes: () => state.routes,
      getJourneys: () => state.journeys,
      getRepairs: () => state.repairs,
      getVehicle: () => state.vehicle,
      getNotifications: (audience: 'user' | 'admin') => state.notifications.filter((n) => n.audience === audience),

      // hazard lifecycle
      confirmHazard: (id: string, vehicleId = 'Vehicle #A72') => {
        const h = state.hazards.find((x) => x.id === id);
        if (!h) return;
        const newCount = h.confirmationCount + 1;
        const newStatus: HazardStatus = h.status === 'provisional' && newCount >= 3 ? 'verified' : h.status;
        patchHazard(id, {
          confirmationCount: newCount,
          status: newStatus,
          lastDetected: now(),
          observations: [...h.observations, { vehicleId, detectedAt: now(), matched: true }],
          timeline: [...h.timeline, { at: now(), label: `${vehicleId} confirmed — ${newCount} independent detections` }],
        });
        setState((s) => ({ ...s, simulated: true }));
      },
      reportIncorrect: (id: string) => {
        patchHazard(id, { status: 'provisional', confidence: Math.max(40, Math.round((state.hazards.find((h) => h.id === id)?.confidence ?? 80) * 0.9)) });
      },
      submitReport: (input: { type: Hazard['type']; description: string; severity: Hazard['severity']; lat: number; lng: number }) => {
        const id = `PH-${2000 + Math.floor(Math.random() * 800)}`;
        const h: Hazard = {
          id,
          type: input.type,
          roadName: 'Sohna Road',
          segmentId: 'rd-sohna',
          latitude: input.lat,
          longitude: input.lng,
          severity: input.severity,
          confidence: 71,
          riskScore: input.severity === 'critical' ? 88 : input.severity === 'high' ? 74 : input.severity === 'moderate' ? 48 : 28,
          confirmationCount: 1,
          firstDetected: now(),
          lastDetected: now(),
          status: 'provisional',
          description: input.description || 'Reported by driver',
          observations: [{ vehicleId: 'You (this vehicle)', detectedAt: now(), matched: false }],
          timeline: [{ at: now(), label: 'Report submitted by driver — provisional' }],
          evidenceImage: undefined,
        };
        setState((s) => ({ ...s, hazards: [h, ...s.hazards], simulated: true }));
        pushNotification({ audience: 'user', title: 'Report submitted', body: `${id} will be compared with nearby observations.`, kind: 'report' });
        return id;
      },

      // repair lifecycle
      createRepair: (hazardId: string, department: string) => {
        const rc: RepairCase = {
          id: `RC-${2400 + Math.floor(Math.random() * 500)}`,
          hazardId,
          assignedDepartment: department,
          assignedAt: now(),
          expectedCompletion: new Date(Date.now() + 3 * 86400000).toISOString(),
          status: 'assigned',
          notes: [{ at: now(), author: 'Ops', text: `Assigned to ${department}.` }],
        };
        setState((s) => ({ ...s, repairs: [rc, ...s.repairs] }));
        patchHazard(hazardId, { status: 'assigned' });
        setState((s) => ({ ...s, simulated: true }));
      },
      updateRepairStatus: (id: string, status: RepairStatus) => {
        setState((s) => ({
          ...s,
          repairs: s.repairs.map((r) =>
            r.id === id ? { ...r, status, ...(status === 'repaired' ? { repairedAt: now() } : {}) } : r,
          ),
        }));
        const rc = state.repairs.find((r) => r.id === id);
        if (rc) {
          const hazardPatch: Partial<Hazard> =
            status === 'assigned' ? { status: 'assigned' }
            : status === 'under_repair' ? { status: 'under_repair' }
            : status === 'repaired' ? { status: 'repaired' }
            : status === 'verified' ? { status: 'verified' }
            : status === 'failed' ? { status: 'verification_failed' } : {};
          if (Object.keys(hazardPatch).length) patchHazard(rc.hazardId, hazardPatch);
        }
      },
      addRepairNote: (id: string, text: string) => {
        setState((s) => ({
          ...s,
          repairs: s.repairs.map((r) =>
            r.id === id ? { ...r, notes: [...r.notes, { at: now(), author: 'Authority', text }] } : r,
          ),
        }));
      },

      // verification simulations (deterministic per selection)
      simulateVerification: (repairId: string, outcome: 'success' | 'failure') => {
        setState((s) => {
          const reps = s.repairs.map((r) => {
            if (r.id !== repairId) return r;
            const passes = (outcome === 'success' ? ['A72', 'F18', 'C92', 'B04', 'E55'] : ['A72', 'F18', 'C92']).map((v, i) => ({
              vehicleId: `Vehicle #${v}`,
              at: new Date(Date.now() + i * 30000).toISOString(),
              defectDetected: outcome === 'failure' ? v === 'C92' : false,
            }));
            const confidence = outcome === 'success' ? 93 : 76;
            return {
              ...r,
              verificationPasses: passes,
              verificationConfidence: confidence,
              status: (outcome === 'success' ? 'verified' : 'failed') as RepairStatus,
              notes: [
                ...r.notes,
                {
                  at: now(),
                  author: 'System',
                  text:
                    outcome === 'success'
                      ? `${passes.length} independent passes detected no defect — repair verified (${confidence}%).`
                      : `Vehicle #C92 still detected the defect — verification failed (${confidence}%).`,
                },
              ],
            };
          });
          const rep = reps.find((r) => r.id === repairId)!;
          return {
            ...s,
            repairs: reps,
            hazards: s.hazards.map((h) =>
              h.id === rep.hazardId ? { ...h, status: outcome === 'success' ? ('verified' as HazardStatus) : ('verification_failed' as HazardStatus) } : h,
            ),
            notifications: [
              {
                id: `n-${Date.now()}`,
                audience: 'admin' as const,
                title: outcome === 'success' ? 'Repair verified' : 'Repair verification failed',
                body: `${repairId}: ${outcome === 'success' ? 'independent passes detected no defect' : 'defect still detected — case can be reopened'}.`,
                createdAt: now(),
                read: false,
                kind: 'repair' as const,
              },
              ...s.notifications,
            ].slice(0, 40),
            simulated: true,
          };
        });
      },
      reopenRepair: (repairId: string) => {
        setState((s) => {
          const reps = s.repairs.map((r) =>
            r.id === repairId ? { ...r, status: 'under_repair' as RepairStatus, notes: [...r.notes, { at: now(), author: 'Ops', text: 'Verification failed — case reopened.' }] } : r,
          );
          const rep = reps.find((r) => r.id === repairId)!;
          return {
            ...s,
            repairs: reps,
            hazards: s.hazards.map((h) => (h.id === rep.hazardId ? { ...h, status: 'under_repair' as HazardStatus } : h)),
          };
        });
      },
      setVehicle: (v: Vehicle) => setState((s) => ({ ...s, vehicle: v })),
      markNotificationsRead: (audience: 'user' | 'admin') =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.audience === audience ? { ...n, read: true } : n)) })),
      resetDemo: () => setState(freshState()),
    }),
    [state, patchHazard, pushNotification],
  );

  return { api, pushDriveLog, pushNotification, tick, setTick, state };
}

export type AppStore = ReturnType<typeof useAppStore>;
