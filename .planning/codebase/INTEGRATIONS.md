# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Music Licensing (reference link only):**
- ClicknClear (`https://music.clicknclear.com`) - Mentioned in UI disclaimer in `src/components/MusicManager.tsx` as a recommended source for competition-licensed music. No API integration; link only.

**Google Fonts:**
- Geist Sans - Loaded via `next/font/google` in `src/app/layout.tsx`. Fetched at build time by Next.js font optimization; no runtime API calls.

## Data Storage

**Databases:**
- None - No database, no ORM, no persistence layer detected.

**File Storage:**
- Local filesystem only - Audio files are uploaded by the user and handled entirely in the browser (File API, ArrayBuffer). No server-side storage.

**Caching:**
- None

**Client State:**
- All application state is held in React `useState` hooks in `src/app/page.tsx`. No persistence to localStorage or sessionStorage.

## Authentication & Identity

**Auth Provider:**
- None - No authentication, no user accounts, no sessions.

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- `console.error` used in `src/components/MusicManager.tsx` for failed audio mix operations. No structured logging library.

## CI/CD & Deployment

**Hosting:**
- Not configured - No deployment config files detected (no `vercel.json`, `Dockerfile`, `.github/workflows/`, etc.)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None detected - The application has no server-side logic and makes no external API calls requiring secrets.

**Secrets location:**
- Not applicable

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser API Dependencies

These are not external integrations in the traditional sense, but the app has hard dependencies on specific browser APIs:

- **Web Audio API** (`AudioContext`, `OfflineAudioContext`, `AudioBuffer`) - Core to BPM detection (`src/lib/bpm-detect.ts`) and audio mixing/rendering (`src/lib/audio-mixer.ts`). Requires a browser that supports Web Audio API.
- **Canvas 2D API** (`HTMLCanvasElement.getContext("2d")`) - Arena drawing in `src/components/ArenaCanvas.tsx`. Requires canvas support.
- **Pointer Events API** - Touch/mouse input for arena drawing in `src/components/ArenaCanvas.tsx`.
- **File API** (`File`, `FileList`, `ArrayBuffer`) - Audio file upload handling in `src/components/MusicManager.tsx`.
- **Blob / URL.createObjectURL** - WAV export and audio preview in `src/components/MusicManager.tsx` and `src/lib/audio-mixer.ts`.

---

*Integration audit: 2026-03-20*
