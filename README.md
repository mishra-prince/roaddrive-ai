# RoadDrive AI 🛣️

**Real-time crowdsourced road-driveability intelligence for drivers and authorities.**

Ordinary vehicles sense road hazards (potholes, waterlogging, open manholes…) → AI validates observations across users → drivers get warnings & better routes → authorities get a live operational picture — from detection to **verified repair**.

> SIH prototype · frontend-only · detection/GPS/routing/verification simulated deterministically. No keys required to run.

## Quick start

```bash
npm install        # also copies CesiumJS assets into public/cesium (postinstall)
npm run dev        # http://localhost:5173
```

Authority console credentials: `admin@roaddrive.gov.in` / `road2026`

## Scale: the 1000-complaints problem

The single hardest real-world issue: 1000 dashcams report the same pothole within 10–20 minutes. Naively, that's 1000 cases and 1000 support tickets. RoadDrive handles it with **geofence deduplication**:

- **One pothole = one case.** Each new report is matched against open hazards within a **40 m radius** of the same defect type (see `DEDUP_RADIUS_M` in `src/hooks/useAppStore.ts`). A match does **not** create a case — it increments that hazard's `confirmationCount`.
- **Everyone is acknowledged.** The *first* reporter gets a **"new case filed"** email; every duplicate gets a **"your report was added as a confirmation"** email. Nobody is ignored; the database stays clean.
- **The duplicates become signal.** 999 duplicates aren't waste — they're the confidence score that tells the authority "this is definitely real and high-priority."

### Production intake pipeline (documented, not built — frontend-only)

Dashcams never write 1000 rows synchronously. The production flow:

```
Dashcam → message queue (Kafka/SQS/Redis Streams)
        → per-geo-cell workers (geohash keyed)
        → idempotency (vehicleId + minute-bucket + geohash)
        → Redis INCR (batched confirmation counts)
        → flush to Postgres every few seconds
```

A rush-hour flood collapses into **"+847 confirmations in 20 min"** on one row. Per-vehicle, per-geo-cell rate limits at the edge stop a stuck camera from flooding the system. The frontend's mock store mirrors this single-key mutation so the swap to a real queue is a backend-only change.

## Transactional email (Resend seam)

Acknowledging thousands of reporters needs async email. This prototype ships the **integration seam**, not live sending:

- `src/api/email.ts` builds the three templates (**case created** / **confirmation added** / **repair verified**) and, if `VITE_EMAIL_API_BASE` is set, POSTs to your backend's `/email/send`. Otherwise it renders the exact HTML into the in-app **outbox** so the demo shows the real message.
- **`RESEND_API_KEY` lives server-side only** — never in the bundle. See `.env.example`.
- To go live: stand up a tiny backend endpoint that calls Resend with the key; set `VITE_EMAIL_API_BASE`.

The **repair-verified** email fires automatically when a repair passes AI verification, closing the loop with the original reporter.

## The two interfaces

| | Driver App `/app` | Authority Console `/admin` |
|---|---|---|
| Audience | Everyone (public) | Authorized personnel only (login-gated) |
| Layout | Mobile-first, bottom nav | Desktop-first, sidebar command center |
| Map | 2D Leaflet + OSM: search, live GPS, real directions (OSRM) | 3D CesiumJS: hazard beams, driveability road glow, fly-to |
| Story | "How driveable is my road *for my vehicle*, and which route?" | "Where are hazards, what's confirmed, was the repair verified?" |

## Architecture

```
src/
├── api/          mock store + geoServices (Nominatim/OSRM) + email (Resend seam)
├── auth/         AdminAuthProvider (mock — swap for a real backend)
├── components/   common UI (+ motion, EmailPreviewModal), Cesium 3D map, demo panel
├── data/         deterministic seed dataset (fixed PRNG — same demo every run)
├── hooks/        useAppStore (dedup intake), useGeolocation, useCamera
├── layouts/      UserLayout / AdminLayout
├── pages/        user/* + admin/*
└── utils/        driveability engine, severity model, geo math
```

**Deterministic by design** — fixed-seed PRNG, the drive simulation is a state machine, every run lands on the same numbers (PH-1024, 94% confidence, 7 confirmations, 82/100 area score). Reliable for SIH judging.

**Clean integration points** — the mock store mirrors a future REST surface (`getHazards`, `submitReport`, `confirmHazard`, `createRepair`, `simulateVerification`…). Replace the store, keep the UI.

## Map providers & licensing

OSM tiles (2D + Cesium base) © OpenStreetMap contributors · Nominatim + OSRM demo servers (free, key-less) · CesiumJS self-hosted from npm (`public/cesium`), no ion token.

## Notes

- The admin gate is frontend-only in this prototype; the demo credential is visible in the login UI by design. Real deployments need server-side auth.
- Routing is real (OSRM) for the map directions; the Home→Cyber Hub route comparison uses seeded spec routes.