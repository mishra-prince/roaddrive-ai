import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppNotification,
  EmailMessage,
  Hazard,
  HazardStatus,
  Journey,
  RepairCase,
  RepairStatus,
  ReportOutcome,
  RoadSegment,
  RouteOption,
  Vehicle,
} from '../types';
import { SEED_HAZARDS, SEED_REPAIRS, SEED_JOURNEYS, SEED_NOTIFICATIONS, seedRoadSegments, seedRoutes } from '../data/hazards';
import { ROADS } from '../data/roads';
import { MY_VEHICLE } from '../data/vehicles';
import { computeSegment, hazardsOnSegment } from '../utils/driveability';
import { haversineM } from '../utils/geo';
import { sendEmail } from '../api/email';

/**
 * Global mock "backend" — a single React context holding the whole app state.
 * UI components never import seed data directly; everything flows through
 * api/* functions so a real backend can replace this file alone.
 *
 * Report intake uses GEOFENCE DEDUPLICATION: a new report within
 * DEDUP_RADIUS_M of an existing same-type hazard is counted as a confirmation
 * (not a new case). This is how 1000 dashcams reporting the same pothole
 * become "1 case + 1000 confirmations" instead of 1000 duplicate cases.
 */

const DEDUP_RADIUS_M = 40;

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
  emails: EmailMessage[];
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
    emails: [],
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
  const makeEmailId = () => `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

  const pushEmail = useCallback((email: EmailMessage) => {
    setState((s) => ({ ...s, emails: [email, ...s.emails].slice(0, 60) }));
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
      getEmails: () => state.emails,

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

      /**
       * Report intake WITH geofence dedup.
       *  - match within DEDUP_RADIUS_M of a same-type open hazard → confirmation
       *  - no match → new case
       * Either way the reporter gets an acknowledgement email + notification.
       */
      submitReport: async (input: {
        type: Hazard['type'];
        description: string;
        severity: Hazard['severity'];
        lat: number;
        lng: number;
        to?: string;
      }): Promise<ReportOutcome> => {
        const to = input.to ?? 'alex.driver@example.com';

        // ── dedup match ──
        const match = state.hazards.find(
          (h) =>
            h.type === input.type &&
            !['repaired', 'verification_pending', 'verified'].includes(h.status) &&
            haversineM([h.latitude, h.longitude], [input.lat, input.lng]) <= DEDUP_RADIUS_M,
        );

        if (match) {
          const newCount = match.confirmationCount + 1;
          const newStatus: HazardStatus = match.status === 'provisional' && newCount >= 3 ? 'verified' : match.status;
          patchHazard(match.id, {
            confirmationCount: newCount,
            status: newStatus,
            lastDetected: now(),
            observations: [...match.observations, { vehicleId: 'You (this vehicle)', detectedAt: now(), matched: true }],
            timeline: [...match.timeline, { at: now(), label: `You confirmed — ${newCount} independent detections` }],
          });
          pushNotification({
            audience: 'user',
            title: 'Matched an existing hazard',
            body: `Your report joins ${match.id} (${match.roadName}) — counted as a confirmation, now ${newCount}.`,
            kind: 'report',
          });
          const email = await sendEmail(
            'confirmation_added',
            { to, hazardId: match.id, hazardType: input.type.replace('_', ' '), roadName: match.roadName, severity: match.severity, confirmations: newCount },
            makeEmailId,
          );
          pushEmail(email);
          setState((s) => ({ ...s, simulated: true }));
          return {
            matched: true,
            hazardId: match.id,
            confirmationCount: newCount,
            message: 'Your report matched an existing hazard — added as a confirmation.',
            emailId: email.id,
          };
        }

        // ── new case ──
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
        pushNotification({ audience: 'user', title: 'New case filed', body: `${id} is now visible to the road authority.`, kind: 'report' });
        const email = await sendEmail(
          'case_created',
          { to, hazardId: id, hazardType: input.type.replace('_', ' '), roadName: h.roadName, severity: input.severity, caseNumber: id },
          makeEmailId,
        );
        pushEmail(email);
        return { matched: false, hazardId: id, confirmationCount: 1, message: 'New case filed.', emailId: email.id };
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
        const snapRep = state.repairs.find((r) => r.id === repairId);
        const snapHazard = snapRep ? state.hazards.find((h) => h.id === snapRep.hazardId) : undefined;

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

        // fire the "repair verified" email to the original reporter on success
        if (outcome === 'success' && snapHazard) {
          void sendEmail(
            'repair_verified',
            {
              to: 'alex.driver@example.com',
              hazardId: snapHazard.id,
              hazardType: snapHazard.type.replace('_', ' '),
              roadName: snapHazard.roadName,
              severity: snapHazard.severity,
              repairVerifiedBy: 5,
            },
            makeEmailId,
          ).then(pushEmail);
        }
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
    [state, patchHazard, pushNotification, pushEmail],
  );

  return { api, pushDriveLog, pushNotification, tick, setTick, state };
}

export type AppStore = ReturnType<typeof useAppStore>;