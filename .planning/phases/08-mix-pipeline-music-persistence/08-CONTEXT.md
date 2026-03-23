# Phase 8: Mix Pipeline & Music Persistence - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Combine per-gait audio tracks into one downloadable kür file with coefficient-weighted durations and crossfades. Persist generated music in IndexedDB so it survives page refresh. "Start forfra" clears music cache. No new generation UI — this phase builds on Phase 7's generated tracks.

</domain>

<decisions>
## Implementation Decisions

### Mix pipeline (MIX-01, MIX-02)
- **D-01:** Rewrite `generateMixTimeline` to use coefficient-weighted durations from `calculateGaitDurations()` instead of equal distribution
- **D-02:** Each exercise gets time proportional to its gait's total duration (from gait-duration.ts)
- **D-03:** Crossfade between gait changes: 2-second overlap with linear fade in/out
- **D-04:** No crossfade between exercises within the same gait — seamless continuation
- **D-05:** `renderMix` already works with OfflineAudioContext — keep existing implementation, just feed better timeline
- **D-06:** MixTrack type updated: replace `file: File` with `audioBlob: Blob` (generated tracks are Blobs, not Files)

### Download (MIX-03)
- **D-07:** "Download kür" button in MusicManager after all gaits have generated tracks
- **D-08:** Output format: WAV (existing `audioBufferToWav`) — universal compatibility
- **D-09:** Filename: `{horseName}-{levelName}-kur.wav` (from wizard store)
- **D-10:** Mix happens client-side via Web Audio API (existing renderMix)
- **D-11:** Progress indicator while mixing (can take 5-10 seconds for a 5-minute WAV)

### IndexedDB persistence (PERS-02)
- **D-12:** Store generated audio Blobs in IndexedDB keyed by projectId + gait
- **D-13:** Use `idb-keyval` or raw IndexedDB API (no heavy library — just get/set Blobs)
- **D-14:** On MusicManager mount: load persisted tracks from IndexedDB, restore audio URLs
- **D-15:** On track generation: save Blob to IndexedDB immediately after generation
- **D-16:** Schema: `music-{projectId}-{gait}` → `{ blob: Blob, prompt: string, genre: string, language: string }`

### Start forfra cleanup
- **D-17:** "Start forfra" in page.tsx already calls `resetToDefaults()` — extend to also clear IndexedDB entries for the project
- **D-18:** Add `clearMusicCache(projectId: string)` function to music persistence module

### Claude's Discretion
- Whether to use `idb-keyval` (tiny lib) or raw IndexedDB API
- Mix progress UI details (progress bar vs spinner)
- Whether to show a mix preview before download
- Edge case: what if one gait has no generated track (skip it or error)

</decisions>

<specifics>
## Specific Ideas

- Existing `audio-mixer.ts` has all the building blocks — just needs better timeline input and Blob-based tracks
- `gait-duration.ts` (from Phase 7 fix) already calculates coefficient-weighted durations per gait — reuse directly
- MusicManager already stores `audioBlob` per track in component state — Phase 8 persists these to IndexedDB
- `audioBufferToWav` already converts AudioBuffer → WAV Blob — reuse for download

</specifics>

<canonical_refs>
## Canonical References

### Existing audio code
- `src/lib/audio-mixer.ts` — generateMixTimeline, renderMix, audioBufferToWav (all to be updated/reused)
- `src/lib/gait-duration.ts` — calculateGaitDurations (coefficient-weighted timing)
- `src/components/MusicManager.tsx` — UI with per-gait tracks, audioBlob state

### State management
- `src/lib/stores/wizard-store.ts` — musicSettings, resetToDefaults
- `src/app/page.tsx` — "Start forfra" handler

### Requirements
- `.planning/REQUIREMENTS.md` — MIX-01, MIX-02, MIX-03, PERS-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `generateMixTimeline()` — rewrite input, keep structure
- `renderMix()` — works as-is with OfflineAudioContext, loop, gain nodes
- `audioBufferToWav()` — perfect for download output
- `calculateGaitDurations()` — coefficient-weighted timing ready to use
- MusicManager `GaitTrack.audioBlob` — source data for mix and persistence

### Integration Points
- MusicManager needs "Download kür" button + mix progress
- MusicManager mount needs IndexedDB load
- MusicManager generate needs IndexedDB save
- page.tsx "Start forfra" needs IndexedDB clear
- audio-mixer MixTrack type needs Blob instead of File

</code_context>

<deferred>
## Deferred Ideas

- MP3 export (smaller file, requires encoding library) — future
- Mix preview playback before download — future polish
- Cloud storage of generated tracks — requires backend/auth
- Share kür link — requires backend

</deferred>

---

*Phase: 08-mix-pipeline-music-persistence*
*Context gathered: 2026-03-23*
