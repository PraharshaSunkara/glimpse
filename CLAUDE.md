# Glimpse — Project Context for Claude

## What this is
A law enforcement investigative tool. Investigators view a map of 
registered cameras in Dallas, draw a zone, and dispatch email requests 
to camera owners for footage. No authentication. Single user type.

## Stack
- Frontend: React 18 + TypeScript, Deck.GL, Vite, Tailwind, Turf.js, React Router
- Backend: Elysia on Bun, port 3001
- Email: Resend SDK (sandbox mode)
- Storage: JSON flat files only — no database

## File structure (backend/src/data/)
- cameras.json — static, read-only, loaded once into memory
- requests.json — written at runtime when emails are dispatched
- submissions.json — written when camera owners submit the form
- uploads/ — directory for uploaded video files

## Camera type → pin color
- traffic → blue [46, 117, 182]
- corporate → amber [176, 112, 0]
- residential → green [45, 106, 45]
- bar_restaurant → purple [107, 63, 160]
- inactive (any type) → gray [136, 136, 136]

## Key data schemas

### Camera (cameras.json entry)
id, name, type, lat, lng, ownerName, ownerEmail, 
coverageDirection, lastVerified, status, placeholderImage, notes

### Request (requests.json entry)
requestId, incidentDescription, incidentDate, incidentTimeFrom,
incidentTimeTo, createdAt, cameras[]
  - cameras[]: token, cameraId, cameraName, ownerName, ownerEmail, emailSentAt

### Submission (submissions.json entry)
token, requestId, cameraId, submittedAt, ownerName, ownerEmail,
footageAvailable, footageDateRange, consentToShare, 
observationNotes, uploadedFilename

## API routes
GET  /api/cameras          → Camera[]
GET  /api/cameras/:id      → Camera | 404
POST /api/requests         → { requestId, sentCount }
GET  /api/respond/:token   → FormData | 404
POST /api/respond/:token   → { success: true } | 400
GET  /uploads/:filename    → file stream

## Component tree
App
├── TopBar + Toast
├── MapView (full-bleed below top bar)
│   ├── DeckGL: IconLayer, EditableGeoJsonLayer, PolygonLayer
│   └── DrawToolButtons (bottom-right)
├── CameraDetailPanel (left overlay, on pin click)
└── FinalizationModal (full-screen overlay, on zone draw or button)
    ├── SummaryStats
    ├── IncidentDetailsForm
    └── CameraReviewGrid → CameraCard[]

## Routes (React Router)
/              → MapView (investigator map)
/respond/:token → RespondPage (camera owner form)

## Important constraints
- All data access goes through repository classes (cameraRepository.ts, 
  requestRepository.ts) — not direct file reads in route handlers
- Camera type is shared from backend/src/types/camera.ts to frontend
- Turf.js runs client-side for point-in-polygon and area calculation
- Emails send in parallel via Promise.all(), failures are logged but 
  don't abort the others
- File uploads saved as {token}_{sanitizedFilename} in backend/uploads/

## Decisions Made (update as you build)
- Using nebula.gl 1.0.4 for draw tools (version compatibility)
- Vite proxy: /api → http://localhost:3001
- [add more as you go]