---
phase: 09-arena-animation-engine
plan: 01
subsystem: animation
tags: [animation, timeline, requestAnimationFrame, interpolation, react-hook]

# Dependency graph
requires:
  - phase: 05-arena-route-generation
    provides: ArenaPath and PathPoint types, route generation
  - phase: 08-mix-pipeline
    provides: GaitDuration type and calculateGaitDurations function
provides:
  - AnimationSegment type and buildAnimationTimeline pure function
  - getPositionAtTime interpolation function
  - getTotalDuration utility
  - useAnimationPlayer React hook with play/pause/seek/setSpeed
  - MarkerState type for marker rendering
affects: [09-02-canvas-rendering, 10-music-sync]

# Tech tracking
tech-stack:
  added: []
  patterns: [arc-length-parameterized-interpolation, rAF-driven-animation-hook, ref-based-closure-safety]

key-files:
  created:
    - src/lib/animation-timeline.ts
    - src/lib/animation-timeline.test.ts
    - src/hooks/useAnimationPlayer.ts
  modified: []

key-decisions:
  - "Arc-length parameterized interpolation for smooth marker movement along route points"
  - "Ref-based approach in useAnimationPlayer to avoid stale closures in rAF loop"
  - "0.5s transition pause between exercises with next-gait color during pause"

patterns-established:
  - "src/hooks/ directory for custom React hooks"
  - "Pure timeline model tested independently from rendering"
  - "rAF loop pattern with ref-synced state for animation hooks"

requirements-completed: [ANIM-01, ANIM-02, ANIM-04]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 9 Plan 1: Animation Timeline Model Summary

**Pure animation timeline builder with arc-length interpolation and rAF-driven useAnimationPlayer hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T21:23:17Z
- **Completed:** 2026-03-23T21:26:56Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- buildAnimationTimeline converts ArenaPath[] + GaitDuration[] into timed AnimationSegment[] with 0.5s transition pauses
- getPositionAtTime interpolates marker position along route points for any time T using arc-length parameterization
- useAnimationPlayer hook drives rAF animation loop with play/pause/seek/setSpeed controls
- 15 unit tests covering timeline building, interpolation, transition pauses, and overgang handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Build animation timeline model with tests (RED)** - `f16b758` (test)
2. **Task 1: Build animation timeline model with tests (GREEN)** - `868e9e5` (feat)
3. **Task 2: Create useAnimationPlayer hook** - `a33c95e` (feat)

## Files Created/Modified
- `src/lib/animation-timeline.ts` - Pure functions: buildAnimationTimeline, getPositionAtTime, getTotalDuration with AnimationSegment and MarkerState types
- `src/lib/animation-timeline.test.ts` - 15 vitest tests covering all timeline and interpolation scenarios
- `src/hooks/useAnimationPlayer.ts` - React hook driving rAF animation with play/pause/seek/setSpeed controls

## Decisions Made
- Arc-length parameterized interpolation chosen over simple index-based interpolation for smooth constant-speed marker movement
- Ref-based approach (playingRef, speedRef, currentTimeRef) to avoid stale closure issues in the rAF callback
- During 0.5s transition pauses, marker shows at last position with next segment's gait color (D-14)
- Created src/hooks/ directory as new convention for custom React hooks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AnimationSegment[] and MarkerState types ready for Plan 02 canvas rendering
- useAnimationPlayer hook ready for Plan 02 to integrate with ArenaCanvas
- API designed for Phase 10 music sync via seek() and currentTime

---
*Phase: 09-arena-animation-engine*
*Completed: 2026-03-23*
