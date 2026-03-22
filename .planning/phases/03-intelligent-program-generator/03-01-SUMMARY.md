---
phase: 03-intelligent-program-generator
plan: 01
subsystem: algorithm
tags: [prng, choreography, tdd, vitest, fisher-yates, mulberry32]

# Dependency graph
requires:
  - phase: 01-codebase-cleanup
    provides: Deduplicated generateProgramOrder in src/lib/program-generator.ts
provides:
  - Intelligent choreography-based program ordering algorithm
  - Seeded PRNG for deterministic test output
  - Left/right pair detection and proximity placement
  - Musical arc structure (build-up, climax, wind-down)
affects: [03-02, 04-rule-validation, 06-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [seeded-prng, fisher-yates-shuffle, score-based-placement, arc-sections]

key-files:
  created:
    - src/lib/__tests__/program-generator.test.ts
  modified:
    - src/lib/program-generator.ts

key-decisions:
  - "Arc sections sized 50%/40%/10% (build-up/climax/wind-down) to satisfy placement constraints"
  - "Score formula: ratingScore*2 + coefficient*3, with D-09 midrange cap at 4 for high-coeff+weakness"
  - "Pair detection via name normalization (removing directional suffixes)"

patterns-established:
  - "Seeded PRNG pattern: mulberry32 for deterministic tests, Math.random for production variety"
  - "Score-based section assignment: lowest scores to build-up, highest to climax"
  - "Pair proximity enforcement: 2-3 positions apart, strength side first"

requirements-completed: [PROG-01, PROG-02, PROG-04, PROG-05, PROG-06]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 3 Plan 1: Intelligent Program Generator Summary

**Choreography-based program ordering with seeded PRNG, musical arc structure, strength/weakness placement, coefficient weighting, and left/right pair proximity**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T19:23:19Z
- **Completed:** 2026-03-22T19:28:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced naive sort-by-strength with multi-factor choreography algorithm
- 17 comprehensive tests covering arc structure, placement, symmetry, randomization, and API contract
- Backwards-compatible: existing 3-arg callers (page.tsx, ProgramPreview.tsx) work unchanged
- Seeded PRNG enables deterministic testing while production uses Math.random for variety

## Task Commits

Each task was committed atomically:

1. **Task 1: Write comprehensive tests (TDD RED)** - `9e22dc1` (test)
2. **Task 2: Implement intelligent program generator (TDD GREEN)** - `02837a1` (feat)

## Files Created/Modified
- `src/lib/__tests__/program-generator.test.ts` - 17 test cases across 5 describe blocks (arc, placement, symmetry, randomization, API contract)
- `src/lib/program-generator.ts` - Complete rewrite: mulberry32 PRNG, Fisher-Yates shuffle, detectPairs, scoreExercise, assignArcSections

## Decisions Made
- Arc section proportions: 50% build-up, 40% climax, 10% wind-down — ensures high-coefficient exercises land in last 40% of program
- Score formula: `ratingScore * 2 + coefficient * 3` with strength=3, neutral=1, weakness=0; D-09 caps high-coeff+weakness at score 4
- Pair detection normalizes names by removing "til venstre/hojre", "(H->V)/(V->H)" suffixes and matching

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial section sizing (35%/30%/35%) placed climax too early in the program, failing placement tests. Adjusted to 50%/40%/10% which correctly positions high-coefficient exercises in the last 40%.

## Known Stubs

None - all functionality is fully wired and tested.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Program generator ready for Phase 03-02 (if applicable) or Phase 04 (rule validation)
- Optional 4th arg `{ seed }` available for any future testing needs
- All 36 tests pass (17 new + 19 existing), zero regressions

## Self-Check: PASSED

- [x] src/lib/__tests__/program-generator.test.ts exists
- [x] src/lib/program-generator.ts exists
- [x] Commit 9e22dc1 exists
- [x] Commit 02837a1 exists

---
*Phase: 03-intelligent-program-generator*
*Completed: 2026-03-22*
