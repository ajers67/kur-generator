# Stack Research

**Domain:** Dressage freestyle (kur) music integration -- Mubert API, audio preview, state persistence
**Researched:** 2026-03-20
**Confidence:** MEDIUM (Mubert API docs are sparse; zustand/audio libraries well-documented)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 (existing) | App framework | Already in use. No reason to change. App Router with `"use client"` for all interactive pages. |
| React | 19.2.3 (existing) | UI library | Already in use. All new libraries must be React 19 compatible. |
| TypeScript | 5.x (existing) | Type safety | Already in use. Mubert API client should be fully typed. |
| Tailwind CSS | 4.x (existing) | Styling | Already in use. New music UI components use Tailwind utilities. |

### New Dependencies for Music Milestone

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| zustand | ^5.0.12 | Wizard state management + localStorage persistence | Built-in `persist` middleware handles localStorage serialization. Single store replaces 10+ useState calls in page.tsx. Works with React 19 via useSyncExternalStore. Tiny (1.2kb). |
| react-h5-audio-player | ^3.10.1 | Audio preview UI for Mubert tracks | React 19 compatible (added in 3.10.0). Accessible, mobile-friendly, TypeScript-native. Handles play/pause/seek/volume with consistent cross-browser UI. |

### Mubert API Integration (No NPM Package)

Mubert has no JavaScript/TypeScript SDK. Build a thin typed client with native `fetch`. This is the right approach -- the API surface is small (4-5 endpoints), and a wrapper adds no value over typed fetch calls.

**API Base URL:** `https://music-api.mubert.com/api/v3`

**Authentication model:**
1. Service-level: `company-id` + `license-token` headers (used to create customers)
2. User-level: `customer-id` + `access-token` headers (used to generate/search tracks)

**Key endpoints:**
| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/service/customers` | POST | Register end-user, get customer-id + access-token | `custom_id` |
| `/public/playlists` | GET | List 150+ music channels/categories | -- |
| `/public/music-library/params` | GET | List available BPM ranges, genres, moods | -- |
| `/public/music-library/tracks` | GET | Search curated tracks by BPM/genre/duration | `bpm`, `genres`, `duration`, `moods` |
| `/public/tracks` | POST | Generate AI track | `playlist_index`, `duration`, `bitrate`, `format`, `intensity`, `mode` |
| `/public/streaming/get-link` | GET | Get WebRTC streaming URL | `playlist_index`, `bitrate`, `type` |

**Critical design note:** Mubert API keys must NOT be exposed client-side. Use a Next.js Route Handler (`app/api/mubert/route.ts`) as a proxy. This is the single server-side piece in an otherwise client-only app -- it is essential for security.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| web-audio-beat-detector | ^8.2.35 (existing) | BPM detection from uploaded files | Keep for upload fallback path. Not needed for Mubert tracks (BPM is metadata). |

### Browser APIs (No NPM Package Needed)

| API | Purpose | Notes |
|-----|---------|-------|
| HTMLAudioElement | Playback of Mubert preview URLs | Native, zero-bundle-cost. react-h5-audio-player wraps this. |
| Web Audio API | Mix rendering (existing) | Already used in audio-mixer.ts. Keep for final mix generation. |
| URL.createObjectURL | Blob playback for mixes | Already used. No change needed. |
| localStorage | Wizard state persistence | Accessed via zustand persist middleware, not directly. |

## Installation

```bash
# New dependencies
npm install zustand react-h5-audio-player

# No dev dependencies needed -- both ship TypeScript types
```

## Architecture Decision: Mubert API Proxy

The Mubert API requires `company-id` and `license-token` for service calls, and `customer-id` + `access-token` for track operations. These credentials must not be in client-side JavaScript.

**Solution:** Next.js Route Handlers in `app/api/mubert/`.

```
app/api/mubert/
  search/route.ts      -- Proxy for music-library/tracks (BPM/genre search)
  generate/route.ts    -- Proxy for tracks generation
  playlists/route.ts   -- Proxy for playlists listing
```

Environment variables in `.env.local`:
```
MUBERT_COMPANY_ID=xxx
MUBERT_LICENSE_TOKEN=xxx
```

The Route Handler creates a customer-id for each session (or reuses one), then forwards requests to Mubert with proper auth headers.

**Confidence:** HIGH -- This is standard Next.js API route pattern. Mubert requires server-side auth.

## Architecture Decision: Zustand Store Shape

Replace the 10+ `useState` calls in `page.tsx` with a single zustand store:

```typescript
// src/store/kur-store.ts
interface KurState {
  // Step 1: Level
  selectedLevel: KurLevel | null;
  // Step 2: Profile
  horseName: string;
  temperament: "calm" | "neutral" | "energetic";
  // Step 3: Ratings
  ratings: Record<number, StrengthRating>;
  // Step 4: Program
  programOrder: Exercise[];
  // Step 5: Arena
  arenaPaths: Record<number, ArenaPath[]>;
  // Step 6: Music
  musicSelections: Record<string, MubertTrack>; // gait -> track
  // Navigation
  currentStep: number;
  // Actions
  setLevel: (level: KurLevel) => void;
  // ... etc
}
```

Persist with `skipHydration: true` to avoid Next.js SSR hydration mismatch:

```typescript
export const useKurStore = create<KurState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'kur-generator-state',
      skipHydration: true,
      partials: (state) => ({
        // Exclude non-serializable data (AudioBuffers, Blobs)
        selectedLevel: state.selectedLevel,
        horseName: state.horseName,
        // ...
      }),
    }
  )
);
```

Call `useKurStore.persist.rehydrate()` in a top-level `useEffect` in the page component.

**Confidence:** HIGH -- Well-documented pattern for Next.js + zustand persist.

## Architecture Decision: Audio Preview Strategy

For Mubert tracks, use the returned URL directly with `<audio>` or react-h5-audio-player. No need to download/decode the full track for preview -- stream it.

For the final mix, continue using the existing Web Audio API OfflineAudioContext approach in `audio-mixer.ts`, but fetch the selected Mubert tracks as ArrayBuffers and decode them.

**Confidence:** MEDIUM -- Mubert URL format (direct download vs streaming) needs verification during implementation.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| zustand (state + persist) | jotai | If state were highly atomic with complex derived values. Kur wizard is a single linear flow -- zustand's centralized store is simpler. |
| zustand (state + persist) | React Context + useReducer | If adding zero dependencies mattered more than DX. Context lacks built-in persist, requires manual localStorage code, and re-renders entire tree. |
| react-h5-audio-player | Custom `<audio>` element | If UI requirements are minimal (single play/pause button). The existing code already uses raw `<audio>` for mix preview -- fine for that. Use react-h5-audio-player for the track browsing UI where users compare multiple tracks. |
| Next.js Route Handler (API proxy) | Edge function / separate backend | Never for this project. Route Handlers are simpler, co-located, and sufficient for proxying a few Mubert calls. |
| Native fetch (Mubert client) | axios / ky | Never. The API surface is 4-5 endpoints. fetch is sufficient. Adding axios for this is bloat. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mubert v2 API (`api-b2b.mubert.com/v2/`) | Legacy. The v3 API (`music-api.mubert.com/api/v3/`) is current with music library search, BPM filtering, and better auth model. | Mubert v3 API |
| Redux / Redux Toolkit | Massive overkill for a 6-step wizard. Boilerplate-heavy. No benefit over zustand for this use case. | zustand |
| SWR / TanStack Query | The Mubert calls are user-initiated (search, generate), not background data fetching. No caching strategy needed -- results are ephemeral. | Direct fetch calls from zustand actions or event handlers |
| howler.js | Audio playback library that wraps Web Audio API. Adds 10kb+ for features we don't need (spatial audio, sprites). Native `<audio>` + react-h5-audio-player covers our needs. | react-h5-audio-player + native HTMLAudioElement |
| Storing AudioBuffer in localStorage | AudioBuffer is not serializable. Attempting to persist it will fail or corrupt state. | Only persist track metadata (URL, BPM, genre, gait assignment). Re-fetch audio on reload if needed. |
| Client-side Mubert API calls | Exposes company-id and license-token in browser. Anyone can extract and abuse your API quota. | Next.js Route Handler proxy |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| zustand@5.0.12 | React 19.x | Uses useSyncExternalStore internally. Fully compatible. |
| react-h5-audio-player@3.10.1 | React 19.x | React 19 peerDep added in 3.10.0. |
| web-audio-beat-detector@8.2.35 | All browsers with Web Audio API | No React dependency. Browser API only. |
| Next.js 16.1.6 | zustand@5, react-h5-audio-player@3.10 | Route Handlers work in App Router. No conflicts. |

## Mubert API Constraints and Design Implications

| Constraint | Impact | Design Response |
|------------|--------|-----------------|
| Trial plan: $49/mo, limited calls | Must minimize wasted generations | Show search results (music library) first. Only generate AI tracks as secondary option. Search is cheaper than generation. |
| No free tier for API (1000 test calls only) | Development needs a plan | Use mock responses during development. Hit real API only for integration testing. |
| BPM filtering only on music-library endpoint | Cannot set exact BPM on AI generation | For kur: use music-library/tracks with BPM filter (walk: 55-65, trot: 140-155, canter: 95-105). AI generation uses mood/intensity instead. |
| Track URLs may expire | Cannot cache URLs long-term | Store track metadata in localStorage, not URLs. Re-search on reload if needed. |
| No JS/TS SDK | Must build own typed client | Keep it in `src/lib/mubert-client.ts`. Type all request/response shapes. |
| Commercial license required at launch | Free/trial is dev-only | Document this in PITFALLS.md. Plan for license upgrade before any public release. |

## Ideal BPM Ranges for Dressage Gaits

These map directly to Mubert music-library search parameters:

| Gait | Danish | BPM Range | Notes |
|------|--------|-----------|-------|
| Walk (Skridt) | Skridt | 55-65 | Slow, 4-beat rhythm |
| Trot (Trav) | Trav | 140-155 | 2-beat diagonal, energetic |
| Canter (Galop) | Galop | 95-110 | 3-beat, rolling rhythm |
| Passage | Passage | 60-70 | Elevated, slow trot |
| Piaffe | Piaffe | 60-70 | Trot in place, similar to passage tempo |

These ranges should be used as defaults in the search UI, with user override capability.

## Sources

- [Mubert API landing page](https://mubert.com/api) -- API overview, redirects from landing.mubert.com (MEDIUM confidence, marketing page)
- [Mubert integration guide](https://mubert.com/blog/how-to-integrate-ai-music-into-your-video-editing-or-ugc-tool-the-complete-beginners-guide) -- Endpoints, auth flow, parameters (HIGH confidence, official blog with code examples)
- [Mubert API v3 Apiary docs](https://mubertmusicapiv3.docs.apiary.io/) -- API reference (could not extract due to JS rendering, LOW confidence)
- [MubertAI/Mubert-Text-to-Music GitHub](https://github.com/MubertAI/Mubert-Text-to-Music) -- v2 API example notebook showing auth flow and tag system (MEDIUM confidence, v2 not v3)
- [zustand npm](https://www.npmjs.com/package/zustand) -- Version 5.0.12 confirmed (HIGH confidence)
- [zustand persist docs](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- skipHydration, onRehydrateStorage (HIGH confidence, official docs)
- [Next.js + Zustand hydration discussion](https://github.com/pmndrs/zustand/discussions/1382) -- SSR hydration patterns (HIGH confidence)
- [react-h5-audio-player npm](https://www.npmjs.com/package/react-h5-audio-player) -- Version 3.10.1 with React 19 support (HIGH confidence)
- [React 19 support issue](https://github.com/lhz516/react-h5-audio-player/issues/240) -- Confirmed in 3.10.0 (HIGH confidence)
- [Mubert pricing](https://mubert.com/render/pricing) -- Trial $49/mo, no free API tier (MEDIUM confidence, render pricing may differ from API pricing)

---
*Stack research for: Kur Generator -- Mubert music integration milestone*
*Researched: 2026-03-20*
