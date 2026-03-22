---
phase: 05-auto-generated-arena-routes
plan: 01
subsystem: domain-logic
tags: [route-generation, arena, prng, tdd, exercise-classification]

# Dependency graph
requires:
  - phase: 03-intelligent-program-generator
    provides: mulberry32 PRNG pattern, Exercise/Gait types
provides:
  - generateRoutes pure function mapping programOrder to ArenaRoute[]
  - classifyExercise function for 13 exercise type categories
  - ArenaRoute type with exerciseId, exerciseName, gait, points, rating
  - Route templates per exercise type with strength/weakness zone variants
affects: [05-02-arena-route-view, 06-drag-and-drop]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-template-registry, exercise-type-classification, zone-based-variant-selection]

key-files:
  created:
    - src/lib/route-generator.ts
    - src/lib/__tests__/route-generator.test.ts
  modified: []

key-decisions:
  - "Duplicated ARENA_LETTERS coords as plain Record<string, PathPoint> rather than importing from ArenaCanvas (avoids coupling domain logic to UI component)"
  - "Route templates organized by rating (strength/weakness/neutral) with multiple variants per category for randomized selection"
  - "Circle approximation using trigonometric points for volte and pirouette routes"

patterns-established:
  - "ExerciseType union: 13 categories for mapping exercise names to route behaviors"
  - "RouteVariants pattern: { strength: PathPoint[][], weakness: PathPoint[][], neutral: PathPoint[][] } per type"
  - "selectVariant(type, rating, rng) for zone-aware template selection"

requirements-completed: [ROUTE-01, ROUTE-02, ROUTE-03]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 5 Plan 1: Route Generator Summary

**Pure generateRoutes function with exercise type classification, zone-based route templates, and seeded PRNG for deterministic arena route generation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T20:30:00Z
- **Completed:** 2026-03-22T20:33:16Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- classifyExercise correctly maps all exercise names from all 7 KUR_LEVELS to 13 ExerciseType categories
- Route templates per exercise type with 2-3 variants each, using arena letter coordinates for precise positioning
- Strength exercises route toward C-end (avg y < 0.5), weakness toward A-end (avg y > 0.5)
- Seeded PRNG via mulberry32 produces deterministic but varied route selections
- 28 tests covering classification, zone placement, connectivity, randomization, and full integration

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for route generator** - `c48455a` (test)
2. **Task 1 GREEN: Implement route generator** - `45d02c4` (feat)

## Files Created/Modified
- `src/lib/route-generator.ts` - Pure route generation function with exercise classification, route templates, and zone placement
- `src/lib/__tests__/route-generator.test.ts` - 28 tests covering all behaviors

## Decisions Made
- Duplicated ARENA_LETTERS coordinates as plain Record<string, PathPoint> in route-generator.ts rather than importing from ArenaCanvas.tsx — keeps domain logic decoupled from UI component
- Route templates organized by StrengthRating (strength/weakness/neutral) with multiple variants per category, enabling randomized selection via PRNG
- Used trigonometric circle approximation (circlePoints helper) for volte and pirouette routes
- Entry route always A -> D -> X (3 points along centerline), matching FEI standard

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all route templates are wired with actual arena coordinates.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- generateRoutes is ready for Plan 02 (ArenaRouteView component) to consume
- ArenaRoute[] output is compatible with existing ArenaPath rendering patterns in ArenaCanvas
- classifyExercise is exported for potential reuse in UI labels or filtering

## Self-Check: PASSED

- [x] src/lib/route-generator.ts exists
- [x] src/lib/__tests__/route-generator.test.ts exists
- [x] Commit c48455a (test) exists
- [x] Commit 45d02c4 (feat) exists
- [x] All 28 tests pass

---
*Phase: 05-auto-generated-arena-routes*
*Completed: 2026-03-22*
