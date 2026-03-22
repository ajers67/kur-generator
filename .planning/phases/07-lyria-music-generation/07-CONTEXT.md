# Phase 7: Lyria Music Generation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Riders can generate custom music for each gait via Google Lyria API with correct BPM, preview it in-browser, control genre/mood, and re-generate individual gait tracks. This replaces the manual file upload flow in MusicManager. The mix pipeline (combining tracks into one file) is Phase 8.

</domain>

<decisions>
## Implementation Decisions

### MusicProvider abstraction
- **D-01:** Create `src/lib/music-provider.ts` with a `MusicProvider` interface: `generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer>`
- **D-02:** First implementation: `LyriaProvider` using Google Lyria RealTime API (via Gemini API)
- **D-03:** Provider abstraction allows swapping to Mubert, ClicknClear, or other sources later without UI changes
- **D-04:** Provider configured via environment variable `NEXT_PUBLIC_MUSIC_PROVIDER` (default: "lyria")

### Google Lyria integration (MUS-01)
- **D-05:** Lyria RealTime uses Gemini API endpoint — requires `NEXT_PUBLIC_GEMINI_API_KEY` env var
- **D-06:** API call runs client-side (browser) to avoid server costs — Lyria RealTime is designed for client use
- **D-07:** BPM auto-set per gait from existing `bpmMatchesGait` ranges: skridt 60, trav 80, galop 100, passage 60, piaffe 60
- **D-08:** Generated audio format: WAV or MP3 (whatever Lyria returns) — stored as Blob in component state
- **D-09:** Each gait gets one track — total 3-5 tracks depending on level (skridt, trav, galop, optionally passage/piaffe)

### Prompt control (MUS-02)
- **D-10:** Global genre/mood selector at top of MusicManager: dropdown with presets ("Klassisk", "Pop/Rock", "Filmmusik", "Jazz", "Elektronisk")
- **D-11:** Per-gait text prompt field for fine-tuning (e.g., "Roligt og majestætisk skridt")
- **D-12:** Auto-generated default prompt per gait: combines genre + gait character (e.g., "Klassisk musik, roligt skridt-tempo, majestætisk og afslappet, 60 BPM")
- **D-13:** User can edit the auto-generated prompt before generating

### In-browser playback (MUS-03)
- **D-14:** HTML5 `<audio>` element with play/pause per gait track
- **D-15:** Simple waveform or progress bar showing playback position
- **D-16:** Volume control per track (slider)

### Re-generation (MUS-04)
- **D-17:** "Generér igen" button per gait track — re-calls Lyria with same or edited prompt
- **D-18:** Previous track replaced (no history/undo) — business model consideration: regeneration within same session is free, new program is paid
- **D-19:** Confirmation before regeneration if track exists: "Erstat nuværende musik?"

### Progress UI (MUS-05)
- **D-20:** Animated spinner/pulse per gait while generating
- **D-21:** Estimated time indicator (Lyria typically 5-15 seconds for a 30-60s clip)
- **D-22:** Error state with retry button if generation fails
- **D-23:** Generate all gaits sequentially with one "Generér musik" button, or generate individually per gait

### UI layout
- **D-24:** Replace current upload-based MusicManager with generation-based UI
- **D-25:** Layout: genre selector at top, then one card per gait (prompt field + generate button + player + re-generate)
- **D-26:** Keep existing MusicManager file but rewrite internals — same Props interface from page.tsx

### Claude's Discretion
- Exact Lyria API endpoint URL and request/response format (needs research)
- Whether to use Gemini SDK or raw fetch
- Audio clip duration per gait (suggest 30-60 seconds)
- Waveform visualization library vs simple progress bar
- Error retry strategy (exponential backoff vs manual retry)

</decisions>

<specifics>
## Specific Ideas

- PROJECT.md notes: "Google Lyria er gratis men eksperimentel — MusicProvider-abstraktion"
- DEVLOG notes BPM ranges: skridt 48-66, trav 72-90, galop 90-110, passage/piaffe ~60 BPM
- Existing `bpmMatchesGait()` in bpm-detect.ts has the authoritative BPM ranges — use these for generation targets
- Existing MusicManager handles file upload + BPM detection + gait assignment — Phase 7 replaces upload with generation but keeps the gait-based structure
- Current audio-mixer.ts has `MixTrack` and `MixSegment` types — Phase 7 generated tracks should be compatible with Phase 8 mix pipeline

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lyria API (needs research)
- Google Lyria RealTime documentation (research needed — API may have changed since project start)
- Gemini API documentation for audio generation endpoints

### Existing music code
- `src/components/MusicManager.tsx` — Current upload-based UI (will be rewritten)
- `src/lib/bpm-detect.ts` — BPM ranges per gait (authoritative for generation targets)
- `src/lib/audio-mixer.ts` — MixTrack/MixSegment types (Phase 8 compatibility)

### Project constraints
- `.planning/PROJECT.md` — Lyria is experimental, MusicProvider abstraction required
- `.planning/REQUIREMENTS.md` — MUS-01 through MUS-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bpmMatchesGait()` ranges in bpm-detect.ts — use as BPM targets for generation
- `MixTrack` type in audio-mixer.ts — generated tracks should be compatible
- `GAIT_COLORS` and `GAIT_LABELS` — for consistent UI styling
- Existing `<audio>` element pattern in MusicManager (audioRef)
- MusicManager Props interface: `{ level: KurLevel, programOrder: Exercise[], onBack: () => void }`

### Established Patterns
- "use client" for browser API access
- useState for local component state
- useCallback for event handlers
- Error state stored in component state with inline display

### Integration Points
- `page.tsx` line 279-284: renders `<MusicManager>` in music step — same Props
- `wizard-store` has `musicSettings` field (genre, mood, lyriaPrompts) — already prepared
- Phase 8 will consume generated tracks via audio-mixer.ts pipeline

</code_context>

<deferred>
## Deferred Ideas

- ClicknClear licensed music integration — v2 (PREM-01), requires partnership
- Mubert AI catalog — v2 (PREM-02), budget alternative
- Upload fallback for own files — v2 (PREM-03), existing code can be restored
- Music tempo matching/time-stretching — future enhancement
- Multi-track layering per gait — future enhancement

</deferred>

---

*Phase: 07-lyria-music-generation*
*Context gathered: 2026-03-22*
