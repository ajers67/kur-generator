# Phase 6: User Customization - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Riders can customize the generated program: reorder exercises via drag-and-drop, adjust routes in the arena, and regenerate the entire program. Changes update both program list and arena view in real-time. Validation runs after every edit. No new generation logic — this phase adds interaction on top of Phase 3 (generator) and Phase 5 (routes).

</domain>

<decisions>
## Implementation Decisions

### Drag-and-drop reordering (EDIT-01)
- **D-01:** Use native HTML5 drag-and-drop (no library) — exercise list is a simple vertical list of <15 items
- **D-02:** Drag handle on each exercise row in ProgramPreview — grip icon on left side
- **D-03:** Visual feedback during drag: dragged item semi-transparent, drop target highlighted with blue border
- **D-04:** On drop: update `programOrder` in wizard-store with new order, routes auto-regenerate
- **D-05:** Validation re-runs automatically after reorder (existing useMemo dependency)

### Route adjustment in arena (EDIT-02)
- **D-06:** Click a route in the arena to select it — selected route gets thicker stroke + highlight
- **D-07:** Selected route shows its exercise name in a tooltip/label
- **D-08:** Drag the selected route to move it — translates all points by the drag delta
- **D-09:** Route movement is constrained to arena bounds (0-1 normalized coords)
- **D-10:** On release: updated route saved to wizard-store, ArenaRouteView re-renders

### Program regeneration (EDIT-03) — REMOVED
- **D-11:** REMOVED — No regeneration button. Business model: one program per purchase, more programs = more purchases. Regeneration is a paid action, not a free button.
- **D-12:** REMOVED
- **D-13:** Routes still auto-regenerate when programOrder changes via drag-drop (existing useMemo)
- **D-14:** REMOVED

### Real-time sync (EDIT-04)
- **D-15:** ProgramPreview and ArenaRouteView share the same programOrder from wizard-store
- **D-16:** When programOrder changes (via drag-drop or regeneration), both views update via React state
- **D-17:** Routes regenerate from the new programOrder — no manual route update needed
- **D-18:** Validation banner in ProgramPreview updates automatically (existing useMemo)

### Program ownership model
- **D-19:** Once the user edits the program (drag-drop), it becomes "custom" — stored as explicit order in wizard-store
- **D-20:** The generator's computed order is replaced with the user's custom order
- **D-21:** "Generer nyt program" button resets to generator output (clears custom order)
- **D-22:** wizard-store needs a `customProgramOrder: number[] | null` field — null = use generated, array = use custom

### Claude's Discretion
- Exact drag-and-drop animation details
- Whether to add keyboard reordering (up/down arrows) as accessibility enhancement
- Route selection hit-testing precision
- Touch device drag behavior optimization

</decisions>

<specifics>
## Specific Ideas

- Current ProgramPreview regenerates programOrder on every render via `generateProgramOrder()` — Phase 6 must change this so user edits persist (D-19 to D-22)
- ArenaRouteView already has "Gener nye ruter" button (seed-based) — Phase 6 adds the program-level regeneration in ProgramPreview
- Validation already runs via useMemo in ProgramPreview — no additional wiring needed for EDIT-04's validation requirement
- HTML5 drag-and-drop is sufficient for <15 items — no need for react-beautiful-dnd or similar

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing components to modify
- `src/components/ProgramPreview.tsx` — Program list that needs drag-and-drop + regenerate button
- `src/components/ArenaRouteView.tsx` — Arena view that needs route selection and movement
- `src/components/ArenaCanvas.tsx` — Canvas renderer that needs click/drag interaction support

### State management
- `src/lib/stores/wizard-store.ts` — Needs `customProgramOrder` field
- `src/lib/types/project.ts` — ProjectData type needs update for custom order
- `src/app/page.tsx` — Root page that computes programOrder (lines 50-52) — needs to respect custom order

### Existing infrastructure
- `src/lib/program-generator.ts` — generateProgramOrder() for regeneration
- `src/lib/route-generator.ts` — generateRoutes() auto-regenerates when programOrder changes
- `src/lib/rule-validator.ts` — validateProgram() auto-runs via useMemo
- `src/components/ValidationBanner.tsx` — Already wired into ProgramPreview

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- ArenaRouteView already handles route regeneration via seed state
- ValidationBanner already wired with useMemo in ProgramPreview
- wizard-store has persistence via zustand — adding customProgramOrder auto-persists
- ArenaCanvas already has pointer event handlers (onPointerDown/Move/Up) — can extend for route interaction

### Established Patterns
- useMemo for derived state (validation, routes)
- useCallback for event handlers
- wizard-store actions for state mutations
- "use client" on interactive components

### Integration Points
- page.tsx line 50-52: `const computedProgramOrder = selectedLevel ? generateProgramOrder(...) : []` — needs to check customProgramOrder first
- ProgramPreview line 21: `const program = generateProgramOrder(...)` — needs to accept programOrder as prop instead of computing
- ArenaRouteView line 23: `generateRoutes(programOrder, ratings, { seed })` — already reactive to programOrder changes

</code_context>

<deferred>
## Deferred Ideas

- Undo/redo stack for edits — future backlog
- Keyboard-only reordering (accessibility) — future enhancement
- Route waypoint editing (add/remove points) — too complex for v1
- Copy/paste program between projects — future feature

</deferred>

---

*Phase: 06-user-customization*
*Context gathered: 2026-03-22*
