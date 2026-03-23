# Phase 9: Arena Animation Engine - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the animation engine that moves a horse+rider marker along the arena routes at gait-appropriate speeds with color coding. This phase creates the core animation logic and renders it on the existing ArenaCanvas. Music sync and playback controls are Phase 10 — but the animation engine must expose a time-based API that Phase 10 can drive.

</domain>

<decisions>
## Implementation Decisions

### Animation timeline model
- **D-01:** Create `src/lib/animation-timeline.ts` — pure function that builds a timeline from routes + durations
- **D-02:** Timeline is an array of `AnimationSegment`: `{ exerciseId, exerciseName, gait, points: PathPoint[], startTime: number, endTime: number }`
- **D-03:** Uses `calculateGaitDurations()` from gait-duration.ts for per-exercise timing
- **D-04:** Each exercise's time = (gait duration / number of exercises in that gait)
- **D-05:** Marker position at time T = interpolate along the points of the active segment

### Marker rendering (ANIM-01)
- **D-06:** Horse+rider marker is a simple filled circle (radius ~8px) with a direction indicator (small triangle pointing along the path)
- **D-07:** Marker drawn on top of all routes in ArenaCanvas draw cycle
- **D-08:** Position updated via `requestAnimationFrame` loop — smooth 60fps animation
- **D-09:** Marker leaves a "trail" effect — the route segment behind the marker draws with full opacity, ahead with reduced opacity

### Gait-appropriate speed (ANIM-02)
- **D-10:** Speed is implicit from the timeline — skridt segments have longer duration per meter, galop shorter
- **D-11:** The marker moves at constant speed within a segment (proportional to path length / segment duration)
- **D-12:** Between exercises: brief pause at transition points (0.5s) to show gait change

### Gait color on marker (ANIM-04)
- **D-13:** Marker fill color = `GAIT_COLORS[currentSegment.gait]` — changes at each gait boundary
- **D-14:** Brief color transition (200ms fade) when gait changes for visual clarity

### Animation state machine
- **D-15:** Animation state: `{ currentTime: number, playing: boolean, speed: number }`
- **D-16:** Exposed via a React hook: `useAnimationPlayer(timeline)` returning `{ state, play, pause, seek, setSpeed }`
- **D-17:** The hook drives a `requestAnimationFrame` loop when playing, updates currentTime
- **D-18:** Phase 10 will connect this hook to music playback — designing the API now for compatibility

### Integration with ArenaCanvas
- **D-19:** ArenaCanvas gets new optional prop: `markerPosition?: { x: number, y: number, gait: Gait }`
- **D-20:** When markerPosition is set, canvas draws the marker on top of routes
- **D-21:** Existing route display unchanged — marker is an overlay

### Claude's Discretion
- Exact marker shape (circle with triangle vs. horse silhouette emoji)
- Trail opacity values
- Interpolation method (linear vs. eased between points)
- Whether to add a subtle "bounce" to the marker for visual life

</decisions>

<specifics>
## Specific Ideas

- Existing ArenaCanvas already has `requestAnimationFrame`-like pattern via useEffect + draw()
- Existing route paths are `PathPoint[]` with normalized 0-1 coords — animation interpolates along these
- `calculateGaitDurations()` gives total time per gait — divide by exercise count for per-exercise timing
- The `useAnimationPlayer` hook pattern allows Phase 10 to sync music by calling `seek()` and reading `currentTime`
- Musik skal afspilles synkroniseret — Phase 10 kobler musikken til animation state, men arkitekturen designes nu

</specifics>

<canonical_refs>
## Canonical References

### Existing arena code
- `src/components/ArenaCanvas.tsx` — Canvas renderer, draw(), PathPoint, ArenaPath types, ARENA_LETTERS_60
- `src/components/ArenaRouteView.tsx` — Route view that passes paths to ArenaCanvas
- `src/lib/route-generator.ts` — Generates ArenaRoute[] with points per exercise

### Timing
- `src/lib/gait-duration.ts` — calculateGaitDurations() for per-gait timing
- `src/lib/audio-mixer.ts` — MixSegment with startTime/endTime per exercise (reference for timeline structure)

### Data
- `src/data/kur-levels.ts` — GAIT_COLORS for marker coloring

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ArenaCanvas` draw() method — add marker drawing after route drawing
- `PathPoint` type — animation interpolates along these
- `GAIT_COLORS` — marker color per gait
- `calculateGaitDurations()` — timing source
- `MixSegment` type in audio-mixer.ts — similar startTime/endTime pattern for timeline

### Established Patterns
- Canvas 2D rendering in ArenaCanvas
- `useCallback` + `useEffect` for draw loops
- Pure functions in src/lib/ for logic
- React hooks for stateful behavior

### Integration Points
- ArenaCanvas needs markerPosition prop
- ArenaRouteView will host the animation player
- Phase 10 will connect useAnimationPlayer to audio playback
- Phase 11 will add fullscreen mode around the animated view

</code_context>

<deferred>
## Deferred Ideas

- Music synchronization — Phase 10
- Playback controls (play/pause/seek) — Phase 10
- Fullscreen preview mode — Phase 11
- Video export (recording canvas to MP4) — v3
- 3D horse model — out of scope

</deferred>

---

*Phase: 09-arena-animation-engine*
*Context gathered: 2026-03-23*
