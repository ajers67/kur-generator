# Project Research Summary

**Project:** Kur Generator -- Mubert Music Integration Milestone
**Domain:** Dressage freestyle (kur) music planning with third-party AI music API
**Researched:** 2026-03-20
**Confidence:** MEDIUM

## Executive Summary

The kur-generator is an existing Next.js 16 wizard app for dressage freestyle planning that currently covers level selection, horse profiling, exercise ordering, and arena drawing. The music milestone adds AI-powered music search and generation via the Mubert API, replacing the current upload-only workflow. Experts building music API integrations in client-heavy apps consistently use a server-side proxy pattern to protect API credentials, an adapter/provider abstraction to support multiple music sources, and localStorage + IndexedDB for state and audio persistence respectively. The existing codebase already has a functional mix engine (Web Audio API, crossfades, WAV export) that can be reused with minimal changes.

The recommended approach is to build a MusicProvider adapter interface with two implementations (Mubert, Upload), proxied through Next.js Route Handlers, with zustand for wizard state management and localStorage persistence. The architecture prioritizes the music library search endpoint over AI generation -- library search returns pre-existing tracks instantly by BPM/genre and does not consume generation quota, while AI generation is async, quota-limited, and should be a secondary option. Only two new npm dependencies are needed: zustand (state + persistence) and react-h5-audio-player (preview UI).

The primary risk is the Mubert API cost and documentation gap. There is no free API tier -- the Trial Plan starts at $49/month, and the API docs are partially gated. The PROJECT.md incorrectly references a "free tier" which appears to be the consumer Render product, not the developer API. This must be validated with real API credentials before any integration code is written. Secondary risks include CORS failures from direct browser API calls (solved by the proxy pattern), AudioContext autoplay policies (solved by using HTML audio elements for preview), and localStorage quota limits (solved by storing only metadata in localStorage and audio blobs in IndexedDB).

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19, TypeScript, Tailwind 4) is fully retained. Two new dependencies are needed, both small and React 19 compatible. Mubert has no JavaScript SDK -- build a thin typed fetch client proxied through Next.js Route Handlers.

**Core technologies:**
- **Next.js 16 (existing):** App framework with Route Handlers for API proxy -- no additional backend needed
- **zustand ^5.0.12 (new):** Wizard state management with built-in localStorage persistence middleware; replaces 10+ useState calls; 1.2KB
- **react-h5-audio-player ^3.10.1 (new):** Audio preview UI for Mubert track browsing; React 19 compatible since 3.10.0
- **Mubert API v3 (external):** Music library search by BPM/genre/mood + AI track generation; requires server-side proxy for credential protection

**Critical version note:** Mubert API v3 at `music-api.mubert.com/api/v3` is current. Do NOT use the legacy v2 API at `api-b2b.mubert.com/v2/`.

### Expected Features

**Must have (table stakes):**
- BPM-aware music search per gait (walk 55-65, trot 140-155, canter 95-110)
- Audio preview/playback before selecting tracks
- Gait assignment for both Mubert and uploaded tracks
- Crossfade transitions between gaits (existing, extend to Mubert tracks)
- Session persistence via localStorage (prerequisite -- Mubert quota is wasted if work is lost on refresh)
- Upload fallback preserved (existing users depend on it)
- Generation budget indicator (prevent quota exhaustion)

**Should have (differentiators):**
- AI music generation by mood/genre (genuinely new for the dressage market)
- Mood/character matching from horse temperament profile to Mubert mood tags
- Smart BPM auto-fill from gait selection
- Exercise-weighted mix timeline (coefficient-based segment duration)

**Defer (v2+):**
- ClicknClear licensed commercial music integration (awaiting partnership)
- PDF/print export combining arena + program + music timeline
- Collaborative sharing (requires backend/accounts)
- DAW-style audio editing (solved by existing tools, scope explosion)
- Spotify/Apple Music integration (licensing impossible for competition use)

### Architecture Approach

The architecture uses an adapter pattern (MusicProvider interface) with two implementations: MubertProvider (API tracks via server proxy) and UploadProvider (local files, wrapping existing upload+BPM-detect logic). Components interact only with the interface, making future providers (ClicknClear) a drop-in addition. The monolithic MusicManager component is decomposed into focused pieces: TrackSearchPanel, AudioPreviewPlayer, GaitTrackSelector, and MixPanel, all sharing state through a zustand store.

**Major components:**
1. **MusicProvider interface + adapters** (`src/lib/music/`) -- abstraction layer for any music source
2. **API proxy routes** (`src/app/api/mubert/`) -- server-side credential protection, rate limiting
3. **Music UI components** (`src/components/music/`) -- search, preview, gait assignment, mix generation
4. **Zustand store with persistence** (`src/store/kur-store.ts`) -- centralized wizard state with localStorage sync
5. **MixEngine** (`src/lib/audio-mixer.ts`) -- existing mix renderer, extended to accept MusicTrack from any provider

### Critical Pitfalls

1. **Mubert "free tier" does not exist for the API** -- The $49/mo Trial Plan is required. Validate credentials and budget before writing any integration code.
2. **CORS + credential exposure from browser API calls** -- Never call Mubert directly from the client. Use Next.js Route Handlers as proxy. This is the first thing to build.
3. **AudioContext autoplay policy** -- Use plain `<audio>` elements for Mubert track previews. Reserve AudioContext for mix rendering only. Always check and resume suspended contexts.
4. **Storing audio blobs in localStorage** -- localStorage has a 5MB limit. Store only JSON metadata there. Use IndexedDB for audio blob caching.
5. **Wasting generation quota on exploration** -- Default UI to music library search (instant, no quota cost). Require confirmation before AI generation. Show remaining quota prominently.
6. **Async track generation treated as synchronous** -- Mubert generation takes seconds and may use webhooks/polling. Design UI with loading states from the start.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (State + API Proxy + Provider Interface)

**Rationale:** Everything depends on the state management layer and the API proxy. Persistence must come before any Mubert integration because losing generated tracks to a page refresh wastes irreplaceable quota. The proxy must exist before any Mubert calls can work.
**Delivers:** Zustand store with localStorage persistence for all wizard state; Next.js Route Handler proxy for Mubert API; MusicProvider interface and types; UploadProvider adapter wrapping existing upload logic.
**Addresses features:** Session persistence (P1), Upload fallback preserved (P1).
**Avoids pitfalls:** Mubert free tier confusion (validate credentials here), CORS/credential exposure (proxy first), localStorage quota (metadata-only persistence design).

### Phase 2: Music Search and Preview

**Rationale:** The music library search endpoint is the primary user flow -- instant results, no quota cost, BPM/genre filtering. Preview playback must work before selection makes sense. This phase delivers the core new user experience.
**Delivers:** MubertProvider adapter; TrackSearchPanel with BPM/genre/mood filters; AudioPreviewPlayer using react-h5-audio-player; TrackCard component; Gait-centric search with auto-BPM defaults.
**Addresses features:** BPM-aware music search (P1), Audio preview (P1), Smart BPM auto-fill (P2).
**Avoids pitfalls:** AudioContext autoplay (use HTML audio for preview), Quota waste (library search is default, not generation).

### Phase 3: Track Selection and Gait Assignment

**Rationale:** With search and preview working, users can now select tracks and assign them to gaits. This connects the music provider output to the existing mix pipeline.
**Delivers:** GaitTrackSelector component; gait coverage indicators; MusicStep orchestrator component replacing MusicManager; dual-source UI (Mubert search tab + Upload tab).
**Addresses features:** Gait assignment for Mubert tracks (P1), Music assignment per gait (table stakes).
**Avoids pitfalls:** Provider-specific code in UI (adapter pattern keeps components source-agnostic).

### Phase 4: AI Generation and Budget Management

**Rationale:** AI track generation is the headline differentiator but is quota-limited and async. Build it after library search works so users have a fallback. The confirmation/budget UI prevents quota waste.
**Delivers:** Generate endpoint proxy; async generation flow with polling/loading states; generation budget counter; confirmation dialog before generating.
**Addresses features:** AI music generation by mood/genre (differentiator), Generation budget indicator (P1).
**Avoids pitfalls:** Async generation not handled (explicit loading states), Quota exhaustion (counter + confirmation).

### Phase 5: Mix Integration and Polish

**Rationale:** With tracks selected from any source, extend the existing mix engine to accept MusicTrack objects. Add mood matching and exercise-weighted timeline as polish.
**Delivers:** MixPanel component; MusicTrack-to-MixTrack conversion; mood/character matching from horse profile; exercise-weighted timeline.
**Addresses features:** Crossfade transitions with Mubert tracks (table stakes), Mood matching (P2), Exercise-weighted timeline (P2).
**Avoids pitfalls:** Silent mix errors (surface errors to UI), WAV encoding main thread block (consider Web Worker).

### Phase Ordering Rationale

- **State and proxy first (Phase 1):** Every subsequent phase depends on persisted state and a working API channel. Without these, nothing else can be built or tested reliably.
- **Search before generation (Phases 2-3 before 4):** The music library endpoint is instant, quota-free, and covers the primary use case (finding tracks by BPM for each gait). Generation is secondary and more complex (async flow, webhooks, quota management).
- **Selection before mixing (Phase 3 before 5):** Users must be able to select and assign tracks before the mix pipeline can be tested end-to-end with Mubert tracks.
- **Polish last (Phase 5):** Mood matching and weighted timelines enhance the experience but are not required for a functional music workflow.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Mubert API credentials and pricing validation -- must confirm Trial Plan features and library endpoint availability before committing to the integration.
- **Phase 4:** Async generation flow -- Mubert's webhook/polling mechanism is poorly documented. May need experimentation during implementation.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Audio preview with HTML audio elements and react-h5-audio-player is well-documented.
- **Phase 3:** Component composition and gait assignment follow existing codebase patterns.
- **Phase 5:** Mix engine extension uses the existing Web Audio API pipeline.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack retained; zustand and react-h5-audio-player are well-documented with confirmed React 19 compatibility |
| Features | MEDIUM-HIGH | Dressage domain requirements well-understood from multiple sources; competitor landscape clear; BPM ranges verified across sources |
| Architecture | MEDIUM | Adapter pattern and proxy pattern are standard; Mubert-specific API response shapes need verification during implementation |
| Pitfalls | HIGH for Web Audio/localStorage pitfalls; MEDIUM for Mubert-specific pitfalls | Browser API pitfalls are well-documented; Mubert API docs are partially gated behind paid access |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Mubert API credentials:** No credentials have been obtained yet. The $49/mo Trial Plan must be activated and credentials verified before Phase 1 coding begins. If budget is unacceptable, the entire Mubert integration needs a pivot (consider mock-only development or alternative API).
- **Mubert music library endpoint availability on Trial Plan:** It is unclear whether the `/music-library/tracks` search endpoint is included in the Trial Plan or requires a higher tier. This is the cornerstone of the search-first UX strategy.
- **Mubert track URL expiration:** Research indicates URLs may expire, but the TTL is unknown. Impacts caching strategy in IndexedDB.
- **Mubert async generation mechanism:** Whether generation uses webhooks, long-polling, or returns a status URL needs verification with real API calls.
- **IndexedDB for audio caching:** Research recommends IndexedDB over localStorage for audio blobs, but the current stack research recommends zustand persist (localStorage only). The persistence layer may need `idb-keyval` for audio blob caching alongside zustand for form state.

## Sources

### Primary (HIGH confidence)
- [zustand npm / docs](https://zustand.docs.pmnd.rs/) -- persist middleware, skipHydration, React 19 compatibility
- [react-h5-audio-player npm](https://www.npmjs.com/package/react-h5-audio-player) -- React 19 support confirmed in 3.10.0
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- AudioContext autoplay policies
- [MDN: Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- localStorage limits, IndexedDB capacity

### Secondary (MEDIUM confidence)
- [Mubert integration guide](https://mubert.com/blog/how-to-integrate-ai-music-into-your-video-editing-or-ugc-tool-the-complete-beginners-guide) -- API endpoints, auth flow, parameters
- [Mubert API landing page](https://mubert.com/api) -- pricing, feature overview
- [MubertAI/Mubert-Text-to-Music GitHub](https://github.com/MubertAI/Mubert-Text-to-Music) -- v2 API examples (informative but not v3)
- [Equimusic](http://www.equimusic.com/), [ClicknClear](https://www.clicknclear.com/sporteducation/dressage) -- competitor/partner landscape
- [Sandra Beaulieu BPM guide](https://www.thecreativeequestrian.com/wordpress/freestylebpm) -- dressage BPM ranges

### Tertiary (LOW confidence)
- [Mubert API v3 Apiary docs](https://mubertmusicapiv3.docs.apiary.io/) -- could not extract due to JS rendering; endpoint structure inferred from other sources
- [Mubert Render pricing](https://mubert.com/render/pricing) -- may not reflect API pricing accurately

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
