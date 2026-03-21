# Phase 2: Wizard Persistence - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Save all wizard state so work survives page refresh. Support multiple kür projects. Show project overview on restore. Explicit "Start forfra" deletes active project.

</domain>

<decisions>
## Implementation Decisions

### State scope
- **D-01:** All wizard state is persisted: level, horse profile, temperament, exercise ratings (steps 1-3)
- **D-02:** Generated program order is persisted (step 4)
- **D-03:** Arena data (currently freehand paths, future: auto-generated routes + user adjustments) is persisted (step 5)
- **D-04:** Music selection metadata (Lyria prompts, genre/mood per gait) is persisted in localStorage. Actual audio data is NOT in this phase (Phase 8: IndexedDB).
- **D-05:** Current wizard step is persisted so restore knows where user left off

### Multiple projects
- **D-06:** Users can have multiple kür projects saved simultaneously
- **D-07:** Each project has a unique ID and stores all its state independently
- **D-08:** Projects are identified by horse name + level for display

### Project selection UI
- **D-09:** Claude's Discretion — choose best UI pattern for project selection (startscreen with list, or dropdown in header)

### Start forfra
- **D-10:** "Start forfra" deletes only the active project, not all projects
- **D-11:** After deleting, user returns to project selection (or starts new if it was the only project)
- **D-12:** Confirmation dialog before deleting (prevent accidental loss)

### Restore behavior
- **D-13:** When opening app with saved projects, show project overview first (not wizard directly)
- **D-14:** Project overview shows: horse name, level, and arena preview thumbnail (read-only)
- **D-15:** User clicks a project to continue from where they left off (last visited step)
- **D-16:** "Opret ny kür" button to start fresh project

### Claude's Discretion
- State management approach (zustand, Context API, or plain localStorage)
- localStorage key structure and serialization format
- Hydration strategy for Next.js SSR compatibility
- Project overview layout and card design
- Arena thumbnail rendering approach

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Codebase references
- `src/app/page.tsx` — All current useState hooks that need persistence (10+ hooks)
- `src/components/ArenaEditor.tsx` — Arena state (paths) that needs persistence
- `src/data/kur-levels.ts` — KurLevel type for project display

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- page.tsx already has well-structured state (selectedLevel, horseName, temperament, exerciseRatings, step, arenaPaths)
- ArenaCanvas already renders paths from an ArenaPath[] array — can be reused for thumbnail

### Established Patterns
- All state via useState hooks in page.tsx — no state library
- Named exports, kebab-case lib files
- "use client" directive on interactive components

### Integration Points
- page.tsx is the single orchestrator — persistence wraps around its state
- ArenaCanvas could render a scaled-down read-only version for thumbnails
- layout.tsx sets html lang="da" — project selection UI must also be Danish

</code_context>

<specifics>
## Specific Ideas

- Project overview should feel like a "recent projects" screen — clean, minimal, one-click to continue
- Arena thumbnail should be small but recognizable (colored paths on white arena)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-wizard-persistence*
*Context gathered: 2026-03-21*
