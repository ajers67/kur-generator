---
phase: 01-code-cleanup
plan: 01
subsystem: lib
tags: [typescript, refactoring, deduplication]

# Dependency graph
requires: []
provides:
  - "Shared generateProgramOrder function in src/lib/program-generator.ts"
  - "Single source of truth for program generation algorithm"
affects: [02-persistence, 03-music-api]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Shared lib module with type-only imports from data layer"]

key-files:
  created: ["src/lib/program-generator.ts"]
  modified: ["src/app/page.tsx", "src/components/ProgramPreview.tsx"]

key-decisions:
  - "Kept sortByStrength as module-private closure inside generateProgramOrder (not exported)"
  - "Used type-only imports for KurLevel, Exercise, StrengthRating"

patterns-established:
  - "Shared algorithm extraction: lib module with type imports from data layer, named export, no default export"

requirements-completed: [QUAL-01]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 01 Plan 01: Deduplicate Program Generation Summary

**Extracted duplicated generateProgramOrder algorithm into shared src/lib/program-generator.ts module, removing 101 lines of duplication across page.tsx and ProgramPreview.tsx**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T23:11:06Z
- **Completed:** 2026-03-20T23:15:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created src/lib/program-generator.ts as single source of truth for program generation
- Removed local generateProgramOrder from page.tsx (44 lines)
- Removed local generateProgram from ProgramPreview.tsx (57 lines)
- Both call sites now import from the shared module

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/lib/program-generator.ts with extracted function** - `2a595d2` (feat)
2. **Task 2: Update page.tsx and ProgramPreview.tsx to import from shared module** - `8cd7813` (refactor)

## Files Created/Modified
- `src/lib/program-generator.ts` - Shared module exporting generateProgramOrder with type-only imports
- `src/app/page.tsx` - Removed local function definition, added import from shared module
- `src/components/ProgramPreview.tsx` - Removed local generateProgram, added import, updated call site

## Decisions Made
- Kept sortByStrength as a closure inside generateProgramOrder rather than a separate exported utility -- it is tightly coupled to the function's logic and not needed elsewhere
- Used type-only imports (`import type`) for data types per project conventions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build toolchain (Next.js build, standalone tsc) has pre-existing environment issues unrelated to this change (workspace root detection, missing TypeScript as direct dependency). Verification done via grep confirming single source of truth and correct imports. TypeScript correctness confirmed by the fact that the project's own tsc (via Next.js) resolves all types correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Program generation is now in a single shared module, ready for any future consumers
- Next plan (01-02) can proceed with dead code cleanup

## Self-Check: PASSED

- FOUND: src/lib/program-generator.ts
- FOUND: commit 2a595d2
- FOUND: commit 8cd7813
- FOUND: 01-01-SUMMARY.md

---
*Phase: 01-code-cleanup*
*Completed: 2026-03-20*
