# Architecture Research

**Domain:** Music API integration in a Next.js single-page wizard app
**Researched:** 2026-03-20
**Confidence:** MEDIUM (Mubert API v3 docs partially verified; adapter pattern is well-established)

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Browser (Client)                              │
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ MusicStep  │  │ TrackSearch│  │AudioPreview│  │  MixEngine │ │
│  │ (orchestr.)│──│ Panel      │  │ Player     │  │  (existing)│ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│        │               │               │               │         │
│  ┌─────┴───────────────┴───────────────┴───────────────┴───────┐ │
│  │                    MusicStore (state)                         │ │
│  │  selectedTracks, searchResults, gaitAssignments, playback    │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                      │
│  ┌─────────────────────────┴───────────────────────────────────┐ │
│  │              MusicProvider (adapter interface)                │ │
│  │  search() | getTrack() | getStreamUrl() | getProviderInfo() │ │
│  └──────┬──────────────────────────────┬───────────────────────┘ │
│         │                              │                          │
│  ┌──────┴────────┐            ┌────────┴──────────┐              │
│  │MubertProvider │            │UploadProvider     │              │
│  │(API tracks)   │            │(local files, kept)│              │
│  └──────┬────────┘            └───────────────────┘              │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │ fetch("/api/mubert/*")
          │
┌─────────┼────────────────────────────────────────────────────────┐
│         │          Next.js Server (API Routes)                    │
│  ┌──────┴──────────────────────────────────────────────────────┐ │
│  │  /api/mubert/search    → proxy to Mubert library endpoint   │ │
│  │  /api/mubert/generate  → proxy to Mubert generation endpoint│ │
│  │  /api/mubert/stream    → proxy to Mubert streaming endpoint │ │
│  └──────┬──────────────────────────────────────────────────────┘ │
│         │  company-id + license-token from env                    │
└─────────┼────────────────────────────────────────────────────────┘
          │
┌─────────┴────────────────────────────────────────────────────────┐
│                    Mubert API v3                                   │
│  music-api.mubert.com                                             │
│  /api/v3/public/music-library/tracks  (search by BPM, genre)    │
│  /api/v3/public/streaming/get-link    (WebRTC low-latency)       │
│  /api/v3/public/playlists             (genre/mood discovery)     │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| MusicStep | Orchestrates the music wizard sub-step (search/select/mix) | React component replacing current MusicManager top-level UI |
| TrackSearchPanel | Search UI: BPM input, genre/mood selectors, results list | React component consuming MusicProvider.search() |
| AudioPreviewPlayer | Play/pause/seek for a single track preview | HTML5 Audio element + minimal controls |
| MixEngine | Generates final WAV mix from selected tracks | Existing `audio-mixer.ts` with minimal changes |
| MusicStore | Centralized state for music step (tracks, selections, playback) | useReducer or a context, extracted from page.tsx |
| MusicProvider (interface) | Abstract contract for any music source | TypeScript interface in `src/lib/music/` |
| MubertProvider | Implements MusicProvider using Next.js API proxy to Mubert | Adapter class in `src/lib/music/` |
| UploadProvider | Implements MusicProvider for user-uploaded local files | Adapter wrapping current upload+BPM-detect logic |
| API Routes (proxy) | Hides Mubert credentials, adds rate-limit guard | Next.js Route Handlers in `src/app/api/mubert/` |

## Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── mubert/
│   │       ├── search/route.ts      # Proxy: search Mubert library
│   │       ├── generate/route.ts    # Proxy: generate a track
│   │       └── stream/route.ts      # Proxy: get streaming URL
│   ├── layout.tsx                   # Existing
│   └── page.tsx                     # Existing (wizard orchestrator)
├── components/
│   ├── music/
│   │   ├── MusicStep.tsx            # Top-level music step (replaces MusicManager UI shell)
│   │   ├── TrackSearchPanel.tsx     # Search form + results
│   │   ├── TrackCard.tsx            # Single track display (BPM, genre, preview btn)
│   │   ├── GaitTrackSelector.tsx    # Per-gait track assignment UI
│   │   ├── AudioPreviewPlayer.tsx   # Inline audio player
│   │   └── MixPanel.tsx            # Mix generation UI (extracted from MusicManager)
│   ├── MusicManager.tsx             # DEPRECATED — keep temporarily as upload fallback
│   └── [existing components...]
├── lib/
│   ├── music/
│   │   ├── types.ts                 # MusicTrack, SearchParams, ProviderInfo interfaces
│   │   ├── provider.ts              # MusicProvider interface definition
│   │   ├── mubert-provider.ts       # MubertProvider adapter
│   │   ├── upload-provider.ts       # UploadProvider adapter (wraps existing upload logic)
│   │   └── index.ts                 # Factory: createMusicProvider(type)
│   ├── audio-mixer.ts               # Existing — modify to accept MusicTrack[]
│   ├── bpm-detect.ts                # Existing — used by UploadProvider
│   └── persistence.ts               # localStorage save/restore for wizard state
├── data/
│   └── [existing files...]
└── hooks/
    ├── use-music-provider.ts        # React hook wrapping MusicProvider
    └── use-wizard-persistence.ts    # Hook for localStorage sync
```

### Structure Rationale

- **`src/lib/music/`:** All music provider logic is pure TypeScript with no React dependency. This makes it testable and ensures the adapter interface is framework-agnostic. When ClicknClear arrives, add `clicknclear-provider.ts` here without touching any UI code.
- **`src/components/music/`:** Breaking the monolithic MusicManager into focused components. Each handles one concern (search, preview, selection, mixing). This mirrors the existing codebase pattern of one-component-per-file.
- **`src/app/api/mubert/`:** Server-side proxy routes. One route per Mubert operation. Keeps API keys in `process.env`, never shipped to client. Uses Next.js Route Handlers (App Router convention).
- **`src/hooks/`:** New directory for custom hooks. The existing codebase has none, but extracting music provider and persistence logic into hooks keeps components clean.

## Architectural Patterns

### Pattern 1: Music Provider Adapter

**What:** A TypeScript interface that abstracts music source operations. Each provider (Mubert, Upload, future ClicknClear) implements the same interface. Components code against the interface, never the concrete provider.

**When to use:** Whenever the app needs music data (search, preview URL, track metadata). Always.

**Trade-offs:** Adds one layer of indirection. Worth it because ClicknClear integration is confirmed as a future requirement, and upload must remain as fallback.

**Example:**
```typescript
// src/lib/music/types.ts
export interface MusicTrack {
  id: string;
  title: string;
  bpm: number | null;
  duration: number;           // seconds
  genre?: string;
  mood?: string;
  previewUrl: string | null;  // URL for <audio> playback
  audioBuffer?: AudioBuffer;  // For local uploads (decoded in browser)
  source: 'mubert' | 'upload' | 'clicknclear';
}

export interface SearchParams {
  bpm?: number;
  bpmRange?: number;          // +/- tolerance
  genre?: string;
  mood?: string;
  duration?: number;
  query?: string;             // free-text for Mubert tags
}

export interface SearchResult {
  tracks: MusicTrack[];
  hasMore: boolean;
  total: number;
}

// src/lib/music/provider.ts
export interface MusicProvider {
  readonly name: string;
  readonly type: 'mubert' | 'upload' | 'clicknclear';

  search(params: SearchParams): Promise<SearchResult>;
  getStreamUrl(trackId: string): Promise<string>;
  getAudioBuffer(trackId: string): Promise<AudioBuffer>;
  isAvailable(): Promise<boolean>;
}
```

### Pattern 2: Server-Side API Proxy

**What:** Next.js Route Handlers that sit between the browser and Mubert API. The browser calls `/api/mubert/search?bpm=120&genre=classical`, the server adds auth headers and forwards to Mubert, returns the response.

**When to use:** Every Mubert API call. Never call Mubert directly from the browser.

**Trade-offs:** Adds latency (extra hop). Essential for key protection. Also enables server-side caching and rate limiting.

**Example:**
```typescript
// src/app/api/mubert/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const MUBERT_BASE = 'https://music-api.mubert.com/api/v3';
const COMPANY_ID = process.env.MUBERT_COMPANY_ID!;
const LICENSE_TOKEN = process.env.MUBERT_LICENSE_TOKEN!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const bpm = searchParams.get('bpm');
  const genre = searchParams.get('genre');
  const duration = searchParams.get('duration');

  const url = new URL(`${MUBERT_BASE}/public/music-library/tracks`);
  if (bpm) url.searchParams.set('bpm', bpm);
  if (genre) url.searchParams.set('genres', genre);
  if (duration) url.searchParams.set('duration', duration);

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'company-id': COMPANY_ID,
      'license-token': LICENSE_TOKEN,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
```

### Pattern 3: Gait-Centric Track Assignment

**What:** The UI organizes music selection around gaits (skridt, trav, galop), not around tracks. Each gait shows recommended BPM ranges and lets the user search/assign one track per gait. This maps directly to the existing `gaitCoverage` pattern in MusicManager.

**When to use:** The primary UI flow for track selection.

**Trade-offs:** Limits users to one track per gait (which is the current design). For freestyle, this is correct -- one musical piece per gait section.

### Pattern 4: Optimistic State with localStorage Persistence

**What:** Wizard state is persisted to localStorage on every meaningful change, restored on page load. State shape is a single serializable object.

**When to use:** All wizard state (level, profile, ratings, paths, music selections). Prevents data loss on refresh.

**Trade-offs:** AudioBuffer objects are not serializable. Music selections must be persisted as track IDs + metadata only, and AudioBuffers re-fetched/re-decoded on restore. This is acceptable since Mubert tracks have stable URLs.

## Data Flow

### Music Search Flow

```
User types BPM / selects genre in TrackSearchPanel
    |
    v
useMusicProvider hook calls provider.search({ bpm, genre })
    |
    v
MubertProvider.search() calls fetch("/api/mubert/search?bpm=120&genre=classical")
    |
    v
Next.js Route Handler adds auth headers, proxies to Mubert API
    |
    v
Mubert returns track list (id, title, bpm, duration, preview URL)
    |
    v
MubertProvider normalizes response into MusicTrack[]
    |
    v
TrackSearchPanel renders TrackCard for each result
    |
    v
User clicks "Brug dette" on a TrackCard
    |
    v
GaitTrackSelector updates gait assignment in MusicStore
    |
    v
State persisted to localStorage
```

### Preview Playback Flow

```
User clicks play on a TrackCard
    |
    v
AudioPreviewPlayer sets <audio src={track.previewUrl}>
    |
    v
Browser streams audio directly from Mubert CDN (or blob URL for uploads)
    |
    v
User hears preview — no processing needed
```

### Mix Generation Flow

```
User has assigned one track per gait, clicks "Generer mix"
    |
    v
MixPanel collects MusicTrack[] for each gait
    |
    v
For each track: provider.getAudioBuffer(trackId) → AudioBuffer
    (Mubert: fetch audio URL, decode; Upload: already decoded)
    |
    v
Existing generateMixTimeline() builds segment timeline
    |
    v
Existing renderMix() renders via OfflineAudioContext
    |
    v
audioBufferToWav() → Blob → preview URL + download
```

### State Persistence Flow

```
Any wizard state change (step, level, ratings, music selections...)
    |
    v
useWizardPersistence hook debounces (300ms) and serializes state
    |
    v
localStorage.setItem("kur-generator-state", JSON.stringify(state))
    |
    v
On page load: check localStorage, hydrate state if found
    |
    v
Non-serializable data (AudioBuffers) re-fetched lazily on demand
```

### Key Data Flows

1. **Search-to-assignment:** User searches by gait-appropriate BPM -> selects track -> assigns to gait -> state updates coverage indicators. This replaces the current upload-and-detect flow for Mubert tracks.
2. **Provider switching:** User toggles between "Soeg musik" (Mubert) and "Upload egen" (Upload) tabs. Both produce MusicTrack objects. The rest of the pipeline (assignment, mixing) is source-agnostic.
3. **Mix pipeline reuse:** The existing `generateMixTimeline` and `renderMix` functions accept `MixTrack[]` with AudioBuffers. The adapter layer converts `MusicTrack` to `MixTrack` at the boundary, keeping the mix engine untouched.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single user) | All client-side, localStorage, no auth needed |
| 100+ users | Add simple rate limiting in API proxy routes (in-memory counter per IP) |
| 1000+ users | Move to server-side session storage; add Mubert response caching in proxy (tracks are immutable, cache for hours) |

### Scaling Priorities

1. **First bottleneck:** Mubert free tier limits (25 tracks, 30 min/day generation). Mitigate with aggressive caching of search results and track URLs in the proxy layer. Design UI to encourage browsing before generating.
2. **Second bottleneck:** AudioBuffer memory. Each decoded track uses significant browser memory. Limit to 3-4 tracks in memory simultaneously. Decode on demand, release when no longer needed.

## Anti-Patterns

### Anti-Pattern 1: Calling Mubert Directly from Browser

**What people do:** Put the API key in `NEXT_PUBLIC_` env var and call Mubert from client code.
**Why it's wrong:** API key exposed in browser network tab. Anyone can steal it and exhaust your quota.
**Do this instead:** Always proxy through Next.js API routes. Only `MUBERT_COMPANY_ID` and `MUBERT_LICENSE_TOKEN` (no `NEXT_PUBLIC_` prefix) in `.env.local`.

### Anti-Pattern 2: Monolithic Music Component

**What people do:** Keep all search, preview, selection, and mixing logic in one large component (which is what MusicManager.tsx currently is).
**Why it's wrong:** Cannot test search independently, cannot reuse preview player, adding ClicknClear means touching everything.
**Do this instead:** Split into focused components (TrackSearchPanel, AudioPreviewPlayer, GaitTrackSelector, MixPanel) that communicate through shared state.

### Anti-Pattern 3: Provider-Specific Code in UI

**What people do:** Write `if (source === 'mubert') { ... } else if (source === 'upload') { ... }` in component code.
**Why it's wrong:** Every new provider requires changes across all components. Violates open-closed principle.
**Do this instead:** Components interact only with `MusicProvider` interface and `MusicTrack` type. Provider-specific logic stays inside the adapter.

### Anti-Pattern 4: Serializing AudioBuffers to localStorage

**What people do:** Try to store decoded audio data in persistence.
**Why it's wrong:** AudioBuffer is not serializable. Even if converted to ArrayBuffer, storing megabytes in localStorage will hit the 5-10MB quota and degrade performance.
**Do this instead:** Persist only track metadata (id, title, bpm, source, previewUrl). Re-fetch and re-decode AudioBuffers on demand.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Mubert API v3 | Server-side proxy via `/api/mubert/*` routes | Auth via company-id + license-token headers. Library endpoint for search; streaming endpoint for preview URLs. Generation endpoint for custom tracks. |
| ClicknClear (future) | Same proxy pattern via `/api/clicknclear/*` routes | Add `ClicknClearProvider` implementing `MusicProvider`. No UI changes needed beyond a provider selector. |
| Browser Web Audio API | Direct usage in `src/lib/` | Used for BPM detection (uploads) and mix rendering. No proxy needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| page.tsx <-> MusicStep | Props down, callbacks up | Same pattern as existing wizard steps. MusicStep receives `programOrder`, `level`. Lifts selected tracks up. |
| MusicStep <-> MusicProvider | Via `useMusicProvider` hook | Hook returns `{ search, getStreamUrl, getAudioBuffer, provider }`. Components never import provider directly. |
| MusicProvider <-> API Routes | HTTP fetch (client -> server) | MubertProvider calls `/api/mubert/*`. UploadProvider never hits the server. |
| MixPanel <-> audio-mixer.ts | Direct function call | MixPanel converts `MusicTrack[]` to `MixTrack[]` and calls existing `generateMixTimeline` + `renderMix`. |
| Persistence <-> page.tsx | Via `useWizardPersistence` hook | Hook wraps useState, auto-saves to localStorage, auto-restores on mount. |

## Build Order (Dependencies)

The following build order respects component dependencies:

1. **MusicProvider interface + types** (`src/lib/music/types.ts`, `provider.ts`)
   - No dependencies. Foundation for everything else.
   - Must be built first so all other components code against the interface.

2. **UploadProvider adapter** (`src/lib/music/upload-provider.ts`)
   - Wraps existing upload + BPM detect logic into MusicProvider interface.
   - Validates the interface design works for the simplest case.

3. **API proxy routes** (`src/app/api/mubert/`)
   - Depends on: Mubert API credentials in `.env.local`.
   - Can be tested independently with curl/Postman.

4. **MubertProvider adapter** (`src/lib/music/mubert-provider.ts`)
   - Depends on: API proxy routes (step 3), types (step 1).
   - Normalizes Mubert responses into MusicTrack[].

5. **useMusicProvider hook** (`src/hooks/use-music-provider.ts`)
   - Depends on: MusicProvider interface (step 1).
   - Thin React wrapper: manages loading/error states, exposes provider methods.

6. **UI components** (`src/components/music/`)
   - Depends on: hook (step 5), types (step 1).
   - Build in order: TrackCard -> AudioPreviewPlayer -> TrackSearchPanel -> GaitTrackSelector -> MixPanel -> MusicStep.

7. **localStorage persistence** (`src/lib/persistence.ts`, `src/hooks/use-wizard-persistence.ts`)
   - Independent of music provider work. Can be built in parallel with steps 3-6.
   - Integrate into page.tsx last.

8. **Integration: wire MusicStep into page.tsx**
   - Depends on: all above.
   - Replace MusicManager usage with MusicStep. Keep MusicManager.tsx until upload path is verified working through UploadProvider.

## Sources

- Mubert API v3 documentation: https://landing.mubert.com/
- Mubert API Apiary docs: https://mubertmusicapiv3.docs.apiary.io/
- Mubert Text-to-Music notebook (API examples): https://github.com/MubertAI/Mubert-Text-to-Music
- Mubert integration guide: https://mubert.com/blog/how-to-integrate-ai-music-into-your-video-editing-or-ugc-tool-the-complete-beginners-guide
- Next.js API route proxy pattern: https://www.smashingmagazine.com/2021/12/protect-api-key-production-nextjs-api-route/
- Adapter pattern in TypeScript: https://refactoring.guru/design-patterns/adapter/typescript/example
- Existing codebase architecture: `.planning/codebase/ARCHITECTURE.md`

---
*Architecture research for: Music API integration in kur-generator*
*Researched: 2026-03-20*
