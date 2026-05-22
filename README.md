# Glimpse

> **Community camera intelligence — map, draw, dispatch.**

Glimpse is a public safety platform that gives safety coordinators and community responders a real-time intelligence layer over a city's registered camera network. Draw a zone on the map, review every camera inside it, and fire off automated outreach emails to every owner in a single click — all without leaving the browser.

---

## What It Does

A coordinator opens Glimpse to a dark-matter map of downtown Dallas, already populated with color-coded pins for every registered camera in the network — traffic infrastructure, corporate lobbies, residential doorbell cameras, bars and restaurants. They click a pin to pull up a detail panel: owner name, contact, coverage direction, last-verified date, and a preview image of the camera's field of view.

When an incident occurs, the coordinator draws a polygon around the relevant area. Glimpse instantly computes which cameras fall inside the zone using client-side spatial analysis, surfaces a full-screen review panel with incident details and a grid of every camera in scope, and automatically dispatches personalized outreach emails to every owner in parallel. Each owner receives a unique, token-gated response link. They fill out a structured form — footage availability, date range, consent to share, observation notes — and optionally upload a video file directly. Every response is stored and linked back to the originating request.

The entire system runs in a browser with zero configuration on the coordinator's end.

---

## Feature Highlights

### Camera Map
- Full-bleed interactive map centered on downtown Dallas (MapLibre GL + dark theme)
- WebGL-accelerated camera pin layer via Deck.GL — renders hundreds of markers at 60fps
- Color-coded by camera type with inactive cameras grayed out
- Hover cursors, click-to-select, smooth pan and zoom

### Camera Detail Panel
- Left-side overlay on pin click, no page navigation
- Displays owner info, coverage direction, last-verified date, type badge, and placeholder preview image
- Graceful image fallback for cameras without preview assets
- "Request This Camera" shortcut for single-camera requests

### Zone Drawing & Spatial Analysis
- Freehand polygon drawing tool via nebula.gl
- Client-side point-in-polygon computation with Turf.js — no round-trip to the server
- Instant summary: camera count, unique owners, and estimated coverage area
- Cameras can be individually toggled out of a request before dispatch

### Finalization & Automated Outreach
- Full-screen review modal with incident description, date, and time range fields
- Camera review grid with per-camera owner details
- One-click automated email outreach to all owners in the zone via the Resend SDK
- Each camera owner gets a unique, single-use response token

### Camera Owner Response Flow
- Token-gated response page served at `/respond/:token`
- Structured form: footage availability, date range, consent to share, free-text observations
- File upload for video evidence — stored as `{token}_{filename}` in the uploads directory
- Submissions persisted and linked to the originating request record

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Map rendering | MapLibre GL via react-map-gl |
| Data visualization | Deck.GL (WebGL, GPU-accelerated) |
| Draw tools | nebula.gl 1.0.4 |
| Spatial analysis | Turf.js (client-side) |
| Styling | Tailwind CSS v4 |
| Build tooling | Vite 6 |
| Routing | React Router |
| Backend runtime | Bun |
| Backend framework | Elysia |
| Email delivery | Resend SDK |
| Storage | JSON flat files (zero-dependency) |

---

## Architecture

```
Browser
  └── React 18 (Vite, TypeScript)
        ├── MapView
        │     ├── Deck.GL WebGL layer  ←→  camera pins, draw overlay, polygon fill
        │     └── MapLibre GL          ←→  tile basemap (dark matter theme)
        ├── CameraDetailPanel          ←→  left overlay on pin click
        └── FinalizationModal          ←→  full-screen dispatch workflow
              ├── IncidentDetailsForm
              └── CameraReviewGrid

Vite dev proxy (/api → :3001)

Backend (Bun + Elysia, port 3001)
  ├── GET  /api/cameras          CameraRepository → cameras.json (read once at boot)
  ├── GET  /api/cameras/:id      CameraRepository → single camera or 404
  ├── POST /api/requests         RequestRepository → write requests.json, fire emails
  ├── GET  /api/respond/:token   look up token → return pre-filled form data
  ├── POST /api/respond/:token   validate → write submissions.json, save upload
  └── GET  /uploads/:filename    stream file to browser

Data layer (JSON flat files — no database required)
  ├── cameras.json      static registry, read-only
  ├── requests.json     one record per dispatch, with per-camera tokens
  └── submissions.json  one record per owner response
```

All data access is isolated behind repository classes. Switching to a database later requires changing only the repository layer — no route handlers touch the file system directly.

---

## Running Locally

### Prerequisites

- [Bun](https://bun.sh) — install with `curl -fsSL https://bun.sh/install | bash`
- Node.js is **not** required; Bun handles both frontend deps and the backend runtime

### Setup

```bash
git clone https://github.com/praharshasunkara/glimpse.git
cd glimpse

# install all workspace dependencies (frontend + backend) in one step
bun install
```

### Start the backend

```bash
bun run dev:backend
# → Backend running at http://localhost:3001
```

### Start the frontend

```bash
bun run dev:frontend
# → Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies all `/api` requests to port 3001, so both servers must be running.

### Data files

The backend expects these files in `backend/src/data/`:

| File | Notes |
|---|---|
| `cameras.json` | Included in the repo — 40+ registered cameras across downtown Dallas |
| `requests.json` | Created automatically on first dispatch if it doesn't exist |
| `submissions.json` | Created automatically on first submission if it doesn't exist |
| `uploads/` | Created automatically on first file upload |

No environment variables, no database migrations, no seed scripts. Clone and run.

### Email (optional)

To enable live email dispatch, set a `RESEND_API_KEY` environment variable before starting the backend. Without it, the backend logs what would be sent and skips the Resend call. Camera owner response links are still generated and logged to the console so the full flow can be tested locally.

---

## Project Structure

```
glimpse/
├── backend/
│   └── src/
│       ├── data/
│       │   ├── cameras.json
│       │   ├── requests.json
│       │   └── submissions.json
│       ├── repositories/
│       │   ├── cameraRepository.ts
│       │   └── requestRepository.ts
│       ├── types/
│       │   └── camera.ts
│       └── index.ts
└── frontend/
    └── src/
        ├── components/
        │   ├── CameraDetailPanel.tsx
        │   ├── DrawToolButtons.tsx
        │   ├── FinalizationModal.tsx
        │   └── MapView.tsx
        ├── pages/
        │   └── RespondPage.tsx
        ├── types/
        │   └── camera.ts
        └── App.tsx
```

---

## Roadmap

The current build is a working end-to-end prototype. Planned work:

### Near-term
- **Request dashboard** — coordinators can browse all open outreach requests, see response rates per dispatch, and preview submitted footage metadata without leaving the tool
- **Live camera status** — periodic health-check pings update pin color in real time to reflect cameras that have gone offline since last verification
- **Submission viewer** — inline video playback for uploaded footage directly in the coordinator's browser, linked to the originating request and camera

### Medium-term
- **Multi-zone requests** — run concurrent outreach efforts with overlapping zones, each tracked independently with separate dispatch histories
- **Audit trail** — every action (zone drawn, email sent, response received, file uploaded) written to an append-only log for accountability and transparency
- **Camera registry management** — an admin interface to add, edit, deactivate, and re-verify cameras without editing JSON files directly
- **Export and reporting** — generate a structured PDF or CSV of all cameras contacted, responses received, and footage availability for a given incident

### Longer-term
- **Role-based access** — separate coordinator and administrator views, with administrators able to approve outreach before emails go out
- **City data integration** — pull live camera registry data from Dallas Open Data APIs instead of a static JSON file, with automatic sync on startup
- **Mobile companion** — a lightweight field view for coordinators on the ground, showing which registered cameras are within a configurable radius of their GPS position
- **Notification layer** — push or SMS alerts to coordinators when a camera owner submits a response, so time-sensitive situations get immediate attention

---

## Why This Stack

**Bun + Elysia** was chosen for the backend because Bun's native TypeScript support and built-in file APIs (`Bun.file`, `Bun.write`) eliminate the toolchain overhead that Node.js setups typically require. Elysia's schema-validated route definitions keep input validation co-located with the handler — no separate middleware chain to trace.

**Deck.GL** was chosen over Leaflet or Google Maps overlays because it uses WebGL directly. At the scale of a real city camera network (hundreds or thousands of points), canvas-based renderers visibly lag. Deck.GL renders at GPU speed and supports complex visualization layers — heatmaps, arcs, trip animations — that will be needed as the data layer grows.

**Flat JSON files** were an intentional early decision: zero infrastructure to stand up, zero ops burden, and the entire data model is immediately inspectable with any text editor. The repository pattern means this is a one-file swap when a database becomes necessary.

---

## Camera Types

| Type | Pin Color | Description |
|---|---|---|
| Traffic | Blue | City DOT intersection and arterial cameras |
| Corporate | Amber | Commercial building lobbies and parking structures |
| Residential | Green | Doorbell and driveway cameras registered by residents |
| Bar / Restaurant | Purple | Venue exterior and entrance cameras |
| Inactive | Gray | Any camera with an inactive status, regardless of type |

---

## Contributing

This project is under active development. If you're interested in contributing, open an issue describing what you want to work on before submitting a pull request — the architecture is intentionally simple and contributions that preserve that simplicity are most likely to be merged.
