---
phase: 06-user-customization
plan: 01
subsystem: ui
tags: [drag-and-drop, html5-dnd, zustand, react, state-management]

# Dependency graph
requires:
  - phase: 03-intelligent-program-generator
    provides: generateProgramOrder function and Exercise types
  - phase: 04-rule-validation-engine
    provides: validateProgram for real-time validation after reorder
provides:
  - customProgramOrder field in ProjectData for user-defined exercise order
  - Drag-and-drop reordering UI in ProgramPreview
  - activeProgramOrder resolver in page.tsx (custom overrides computed)
affects: [06-user-customization, arena-routes, music-manager]

# Tech tracking
tech-stack:
  added: []
  patterns: [HTML5 native drag-and-drop, locked first/last positions, custom-over-computed order resolution]

key-files:
  created: []
  modified:
    - src/lib/types/project.ts
    - src/lib/stores/wizard-store.ts
    - src/app/page.tsx
    - src/components/ProgramPreview.tsx

key-decisions:
  - "HTML5 native DnD over library (no new dependencies, sufficient for list reordering)"
  - "Entry and finale positions locked (index 0 and last) per choreography rules"
  - "customProgramOrder resets to null on level change to avoid stale custom orders"

patterns-established:
  - "Custom-over-computed pattern: customProgramOrder overrides computedProgramOrder via activeProgramOrder resolver"
  - "Locked positions: entry/finale cannot be dragged or be drop targets"

requirements-completed: [EDIT-01, EDIT-03, EDIT-04]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 06 Plan 01: Exercise Reordering Summary

**HTML5 drag-and-drop exercise reordering with custom order persistence via wizard-store and locked entry/finale positions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T21:05:28Z
- **Completed:** 2026-03-22T21:09:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- customProgramOrder field added to ProjectData with null-means-computed semantics
- ProgramPreview refactored from internal generation to prop-driven with drag-and-drop reordering
- activeProgramOrder resolver in page.tsx ensures custom order flows to ArenaRouteView and MusicManager
- Validation and routes auto-update when program order changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add customProgramOrder to types, store, and page.tsx wiring** - `7bd1699` (feat)
2. **Task 2: Add HTML5 drag-and-drop to ProgramPreview exercise rows** - `f8696e4` (feat)

## Files Created/Modified
- `src/lib/types/project.ts` - Added customProgramOrder field to ProjectData interface and defaults
- `src/lib/stores/wizard-store.ts` - Added setCustomProgramOrder action, persistence in load/save, reset on level change
- `src/app/page.tsx` - Added activeProgramOrder resolver, wired custom order to all consumers
- `src/components/ProgramPreview.tsx` - Refactored to accept programOrder prop, added HTML5 DnD with grip handles and visual feedback

## Decisions Made
- HTML5 native DnD used instead of a library (dnd-kit, react-beautiful-dnd) since the interaction is simple list reordering with no complex constraints
- Entry (first) and finale (last) positions locked per choreography principles -- cannot be dragged or be drop targets
- customProgramOrder resets to null when user changes level, preventing stale orders from a different level's exercises
- EDIT-03 regeneration button explicitly NOT added per business model (one program per purchase, D-11)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data flows are fully wired.

## Next Phase Readiness
- Drag-and-drop reordering complete, ready for Phase 06 Plan 02 (arena route editing)
- activeProgramOrder is the single source of truth for all downstream consumers

## Self-Check: PASSED

All 4 files verified present. Both commits (7bd1699, f8696e4) confirmed in git log. All acceptance criteria patterns found in target files.

---
*Phase: 06-user-customization*
*Completed: 2026-03-22*
