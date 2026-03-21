---
phase: 02-wizard-persistence
plan: 01
subsystem: state-management
tags: [zustand, localStorage, typescript, persistence]

# Dependency graph
requires:
  - phase: 01-cleanup
    provides: clean codebase with deduplicated program generator
provides:
  - ProjectMeta, ProjectData, MusicSettings types with DEFAULT_PROJECT_DATA
  - STEPS const and STEP_LABELS record (canonical source for wizard steps)
  - useProjectStore (persisted project list with CRUD)
  - useWizardStore (in-memory wizard state with manual load/save)
  - saveProjectData/loadProjectData/deleteProjectData persistence helpers
  - useHydrated hook for SSR-safe rendering
affects: [02-wizard-persistence, 03-music-api, 07-polish]

# Tech tracking
tech-stack:
  added: [zustand]
  patterns: [zustand-persist-middleware, manual-persistence-with-versioning, ssr-hydration-hook]

key-files:
  created:
    - src/lib/types/project.ts
    - src/lib/stores/project-store.ts
    - src/lib/stores/wizard-store.ts
    - src/lib/stores/project-persistence.ts
    - src/lib/use-hydration.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Zustand persist middleware for project list, manual persistence for wizard data — separates meta (auto-synced) from heavy data (explicitly saved)"
  - "Versioned localStorage format ({ state, version: 1 }) to enable future migrations"
  - "MusicSettings interface added per D-04 decision, placeholder for Phase 7 population"

patterns-established:
  - "Zustand store pattern: create<State>()(...) with typed interface"
  - "localStorage key convention: kur-projects (list), kur-project-{id} (per-project data)"
  - "Persistence versioning: wrap data in { state, version } envelope"

requirements-completed: [PERS-01, PERS-03, PERS-04]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 02 Plan 01: Data Model and Stores Summary

**Zustand stores with typed project model, versioned localStorage persistence, and SSR hydration hook**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T21:53:45Z
- **Completed:** 2026-03-21T21:55:26Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Complete data model (ProjectMeta, ProjectData, MusicSettings) matching current page.tsx state shape
- Persisted project list store with CRUD operations via zustand persist middleware
- In-memory wizard store with manual load/save for per-project data
- Versioned localStorage persistence helpers ready for future migration support
- SSR-safe hydration hook for client-only rendering gates

## Task Commits

Each task was committed atomically:

1. **Task 1: Install zustand and create project types + persistence helpers** - `5e51ce1` (feat)
2. **Task 2: Create zustand stores (project list + wizard state)** - `a89c588` (feat)

## Files Created/Modified
- `src/lib/types/project.ts` - ProjectMeta, ProjectData, MusicSettings types, STEPS, STEP_LABELS, DEFAULT_PROJECT_DATA
- `src/lib/stores/project-store.ts` - Zustand persisted store for project list (kur-projects key)
- `src/lib/stores/wizard-store.ts` - Zustand in-memory store for active wizard state with load/save
- `src/lib/stores/project-persistence.ts` - localStorage helpers with versioned envelope format
- `src/lib/use-hydration.ts` - useHydrated hook for SSR mismatch prevention
- `package.json` - Added zustand dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- Zustand persist middleware for project list, manual persistence for wizard data -- separates meta (auto-synced) from heavy data (explicitly saved)
- Versioned localStorage format ({ state, version: 1 }) to enable future data migrations
- MusicSettings interface added per D-04 decision, ready for Phase 7 population

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All types and stores ready for Plan 02 (wizard UI integration)
- useProjectStore provides project CRUD for project list page
- useWizardStore provides all setters needed to replace page.tsx useState hooks
- useHydrated ready for SSR-safe store consumption

## Self-Check: PASSED

All 5 created files verified present. Both task commits (5e51ce1, a89c588) verified in git log.

---
*Phase: 02-wizard-persistence*
*Completed: 2026-03-21*
