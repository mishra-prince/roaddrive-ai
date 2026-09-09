# RoadDrive AI 🛣️

**Real-time crowdsourced road-driveability intelligence for drivers and authorities.**

Ordinary vehicles sense road hazards (potholes, waterlogging, open manholes…) → AI validates observations across users → drivers get warnings & better routes → authorities get a live operational picture — from detection to **verified repair**.

> SIH prototype · frontend-only · all detection/GPS/routing/verification are simulated deterministically — no real AI inference, no backend, no API keys.

## Quick start

```bash
npm install        # also copies CesiumJS assets into public/cesium (postinstall)
npm run dev        # http://localhost:5173
```

Demo credentials for the authority console:

```
admin@roaddrive.gov.in / road2026
```

## The two interfaces

| | Driver App `/app` | Authority Console `/admin` |
|---|---|---|
| Audience | Everyone (public) | Authorized personnel only (login-gated) |
| Layout | Mobile-first, bottom nav | Desktop-first, sidebar command center |
| Map | Clean 2D (Leaflet + OSM): search, live location, real directions (OSRM) | 3D spatial intelligence (CesiumJS): hazard beams, driveability road glow, fly-to |
| Story | "How driveable is my road *for my vehicle*, and which route should I take?" | "Where are the hazards, what's confirmed, what's being repaired — and was the repair verified?" |

## Feature map

**Driver app** — Home driveability dial (82/100 seeded demo) · live map with hazard clustering & layers · **LIVE DRIVE** deterministic detection pipeline (scanning → detected → located → matched → confirmed → alert) · real device camera (getUserMedia, falls back to simulated road) · hazard evidence & anonymous confirmations · vehicle-specific risk · route comparison with explainable recommendation (Fastest 18 min/51 vs Recommended 21 min/89) · reporting · journey history · notifications · privacy-first messaging (faces/plates blurred)

**Authority console** — sign-in gate with session expiry · KPI dashboard · **Cesium 3D map** (self-hosted assets, no ion token): severity filters, status filters, search, road-condition overlay, critical-hazard beams, selected-hazard fly-to, 2D fallback if WebGL is unavailable · hazard table (search/sort/filter/pagination/bulk) · hazard detail with evidence + confirmation timeline · verification queue · repair lifecycle stepper (Detected → Verified → Assigned → Under Repair → Repaired → Verification Pending → AI Verified, with reopen-on-failure) · analytics (Recharts, labelled demo data) · anonymous fleet view · floating **demo scenario controls** driving the full SIH flow

## Architecture

```
src/
├── api/          mockApi + store (single source of truth for both interfaces)
│   └── geoServices.ts   Nominatim search + OSRM directions (free, key-less)
├── auth/         AdminAuthProvider (mock — swap for a real backend later)
├── components/   common UI, Cesium 3D map + 2D fallback, demo panel
├── data/         deterministic seed dataset (fixed PRNG — same demo every run)
├── hooks/        useAppStore, useGeolocation, useCamera
├── layouts/      UserLayout (mobile-first) / AdminLayout (desktop-first)
├── pages/        user/* + admin/*
└── utils/        driveability engine, severity model, geo math
```

**Deterministic by design** — the seed PRNG is fixed, the drive simulation is a state machine (no random events), and every demo run lands on the same numbers (PH-1024, 94% confidence, 7 confirmations, 82/100 area score). Reliable for SIH judging.

**Clean integration points** — the mock store mirrors a future REST surface (`getHazards`, `confirmHazard`, `createRepair`, `simulateVerification`, …). Replace the store, keep the UI. Planned: FastAPI + PostgreSQL + real YOLO detection + OSRM + FCM.

## Map providers & licensing

- **OSM tiles** (2D + Cesium base layer) — © OpenStreetMap contributors
- **Nominatim** (search) & **OSRM demo server** (routing) — free public endpoints, no API keys; the UI degrades gracefully if unreachable
- **CesiumJS** — self-hosted from npm (`public/cesium`), no ion token required

## Notes

- The admin gate is frontend-only in this prototype — real deployments need server-side auth. Credential visibility in the login UI is intentional for the SIH demo.
- Routing is real (OSRM) for the map directions; the Home→Cyber Hub route comparison uses the seeded spec routes.
