---
phase: 06-user-customization
plan: 02
subsystem: ui
tags: [canvas-interaction, drag-and-drop, hit-testing, pointer-events, route-editing]

# Dependency graph
requires:
  - phase: 05-auto-generated-arena-routes
    provides: ArenaCanvas with path rendering and coordinate system
  - phase: 06-user-customization
    provides: Plan 01 drag-and-drop reordering and activeProgramOrder resolver
provides:
  - Click-to-select route interaction in ArenaCanvas via hit testing
  - Drag-to-move route repositioning with bounds clamping
  - Visual selection feedback (thicker stroke, glow, bordered label)
  - Route movement persistence via wizard-store setArenaPaths
affects: [arena-routes, music-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [point-to-segment distance hit testing, pointer capture for drag, drag offset state pattern, dual-mode canvas (draw vs route-interactive)]

key-files:
  created: []
  modified:
    - src/components/ArenaCanvas.tsx
    - src/components/ArenaRouteView.tsx

key-decisions:
  - "Point-to-segment distance for hit testing (0.04 threshold in normalized coords)"
  - "Drag offset state pattern: track delta during drag, apply on pointerUp for clean re-render"
  - "Route-interactive mode is mutually exclusive with draw-interactive mode (isRouteInteractive requires no onMouseDown)"
  - "movedPaths Map in ArenaRouteView tracks user-adjusted positions separately from generated routes"

patterns-established:
  - "Dual-mode canvas: isDrawInteractive vs isRouteInteractive determined by which callback props are provided"
  - "Drag offset pattern: useRef for start point + useState for offset + apply on release"

requirements-completed: [EDIT-02, EDIT-04]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 06 Plan 02: Route Interaction Summary

**Click-to-select and drag-to-move arena route interaction with hit testing, visual selection feedback, and bounds-clamped repositioning**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T21:12:06Z
- **Completed:** 2026-03-22T21:15:11Z
- **Tasks:** 1 (of 2 -- checkpoint pending)
- **Files modified:** 2

## Accomplishments
- Routes are clickable in the arena canvas via point-to-segment distance hit testing
- Selected route highlighted with thicker stroke (4.5px), glow effect (6px at 30% opacity), and bordered label
- Selected route can be dragged to a new position with pointer capture for smooth tracking
- Route movement clamped to arena bounds (0-1 normalized coordinates)
- Moved route positions persist via wizard-store setArenaPaths
- Exercise list rows are clickable to select/deselect routes (synced with canvas)
- Info bar shows selected exercise name with drag instruction in Danish

## Task Commits

Each task was committed atomically:

1. **Task 1: Add route selection and drag-move interaction to ArenaCanvas** - `336f37f` (feat)

## Files Created/Modified
- `src/components/ArenaCanvas.tsx` - Added route interaction props, findNearestRoute hit testing, drag-to-move with pointer capture, visual selection feedback (glow + thick stroke + bordered label), dual-mode rendering
- `src/components/ArenaRouteView.tsx` - Added selectedRouteIndex state, handleRouteMove handler, movedPaths Map for tracking user-adjusted positions, info bar for selected exercise, clickable exercise list rows

## Decisions Made
- Point-to-segment distance algorithm for hit testing with 0.04 normalized-coord threshold -- accurate for typical route density
- Drag offset tracked as state (not ref) to trigger re-renders during drag for smooth visual feedback
- movedPaths stored as Map<number, PathPoint[]> in ArenaRouteView to track per-route overrides without mutating generated routes
- Route-interactive mode mutually exclusive with draw-interactive mode -- prevents conflicts between the two interaction patterns
- Labels and transitions update dynamically during drag via offset application in the draw function

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data flows are fully wired.

## Next Phase Readiness
- Route interaction complete, awaiting human verification (Task 2 checkpoint)
- All EDIT requirements (01, 02, 03-removed, 04) are implemented across Plans 01 and 02

## Self-Check: PASSED

All 2 modified files verified present. Commit 336f37f confirmed in git log. All 6 acceptance criteria patterns found in target files. Build passes cleanly.

---
*Phase: 06-user-customization*
*Completed: 2026-03-22*
