---
phase: 02-wizard-persistence
plan: 02
subsystem: ui
tags: [zustand, react, project-selector, persistence, hydration, localStorage]

# Dependency graph
requires:
  - phase: 02-wizard-persistence plan 01
    provides: zustand stores (useProjectStore, useWizardStore), types (ProjectMeta, ProjectData), persistence helpers, useHydrated hook
provides:
  - ProjectSelector screen showing saved projects with arena thumbnails
  - ProjectCard component with horse name, level, step, and arena preview
  - ArenaThumbnail read-only canvas component for project cards
  - page.tsx wired to zustand stores with auto-save, project lifecycle, hydration guard
  - Multi-project support with create, resume, and delete flows
affects: [03-intelligent-program-generator, 06-user-customization]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-store-consumption-in-page, auto-save-via-useEffect, hydration-guard-pattern, project-selector-routing]

key-files:
  created:
    - src/components/ArenaThumbnail.tsx
    - src/components/ProjectCard.tsx
    - src/components/ProjectSelector.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "Hydration guard renders loading skeleton until stores are hydrated, preventing SSR mismatch"
  - "Auto-save via useEffect on key state changes rather than explicit save buttons"
  - "Project selector shown when no activeProjectId, wizard shown when project is active"

patterns-established:
  - "Hydration guard pattern: useHydrated() -> show skeleton -> render real UI"
  - "Auto-save pattern: useEffect watches key state fields and calls saveCurrentProject + updateProjectMeta"
  - "Project routing: null activeProjectId = selector view, non-null = wizard view"

requirements-completed: [PERS-01, PERS-03, PERS-04]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 02 Plan 02: Project Selector UI and Store Wiring Summary

**Project selector with arena thumbnails, page.tsx refactored to zustand stores with auto-save and multi-project lifecycle**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-21T21:55:00Z
- **Completed:** 2026-03-21T22:00:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Three new components: ArenaThumbnail (read-only canvas), ProjectCard (project info with thumbnail), ProjectSelector (grid overview with create/delete)
- page.tsx fully refactored from useState to zustand store reads with auto-save on state changes
- Complete persistence flow verified end-to-end: create project, fill wizard, refresh, resume from project card, multi-project support, delete with confirmation
- Hydration-safe rendering prevents SSR mismatch errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ArenaThumbnail, ProjectCard, and ProjectSelector components** - `3d8911c` (feat)
2. **Task 2: Refactor page.tsx to use stores and wire persistence** - `66850df` (feat)
3. **Task 3: Verify persistence flow end-to-end** - checkpoint:human-verify (approved, no code changes)

## Files Created/Modified
- `src/components/ArenaThumbnail.tsx` - Read-only canvas rendering arena paths with gait colors for project card thumbnails
- `src/components/ProjectCard.tsx` - Clickable card showing horse name, level, current step, arena thumbnail, and delete button
- `src/components/ProjectSelector.tsx` - Project overview grid with "Opret ny kur" button, empty state, and delete confirmation
- `src/app/page.tsx` - Refactored from useState to zustand stores, added hydration guard, auto-save, project selector routing, "Start forfra" and "Tilbage til projekter" buttons

## Decisions Made
- Hydration guard renders loading skeleton until stores are hydrated, preventing SSR mismatch
- Auto-save via useEffect on key state changes rather than explicit save buttons
- Project selector shown when no activeProjectId, wizard shown when project is active

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full persistence system operational: create, save, restore, delete projects
- Wizard state survives page refresh and browser close
- Multi-project support ready for future features
- Phase 2 complete (all 3 plans done) -- ready for Phase 3 (Intelligent Program Generator)

## Self-Check: PASSED

All 4 files verified present (3 created, 1 modified). Both task commits (3d8911c, 66850df) verified in git log.

---
*Phase: 02-wizard-persistence*
*Completed: 2026-03-21*
