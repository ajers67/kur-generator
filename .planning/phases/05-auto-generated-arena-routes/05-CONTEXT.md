# Phase 5: Auto-generated Arena Routes - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate visual routes in the 20x60 arena for each exercise in the program, connected with transition lines. Routes are auto-generated based on exercise type and strength/weakness rating. No user editing of routes (that's Phase 6) — this phase is read-only visualization.

</domain>

<decisions>
## Implementation Decisions

### Route generation function
- **D-01:** Pure function `generateRoutes(programOrder: Exercise[], ratings: Record<number, StrengthRating>, options?: { seed?: number }): ArenaRoute[]`
- **D-02:** Lives in `src/lib/route-generator.ts` — same pattern as program-generator.ts and rule-validator.ts
- **D-03:** `ArenaRoute` type: `{ exerciseId: number, exerciseName: string, gait: Gait, points: PathPoint[], rating: StrengthRating }`
- **D-04:** Uses existing `PathPoint` type from ArenaCanvas (`{ x: number, y: number }` normalized 0-1)
- **D-05:** Reuses existing `ARENA_LETTERS_60` positions from ArenaCanvas for precise letter references

### Route templates per exercise type (ROUTE-01)
- **D-06:** Based on CHOREOGRAPHY-RULES.md §6, each exercise type maps to a route template:
  - Extensions/lengthenings: Diagonal routes (M→K, H→F, F→H, K→M)
  - Halvpas: Diagonal from centerline or along centerline
  - Skulderhind/travers: Along long side (E→H or B→M direction)
  - Pirouette: Small circle near centerline or C
  - Passage: Centerline A→C direction (showpiece)
  - Piaffe: Point near X or C (stationary)
  - Skridt: Along long side (recovery)
  - Overgang/combination: Corner or short side
  - Indridning: A → X (standard entry)
  - Volte: Circle at specified size (10m = radius on arena)
  - Kontragalop: Along long side, continuing past corner
  - Changér: Diagonal or through X
- **D-07:** Multiple route variants per exercise type (2-3 alternatives) — randomized selection prevents identical programs
- **D-08:** Routes are sequences of PathPoints forming smooth curves (use bezier control points or intermediate points for curves)

### Strength/weakness zone placement (ROUTE-02)
- **D-09:** Strength exercises routed toward C-end (y < 0.3 in normalized coords where C is at y=0)
- **D-10:** Weakness exercises routed toward A-end or along sides (y > 0.7, or x near 0/1)
- **D-11:** Neutral exercises use standard placement for their type
- **D-12:** Zone selection integrated into route template selection — e.g., strength extension uses H→F diagonal (toward C), weakness uses F→H (away from C)

### Transition connections (ROUTE-03)
- **D-13:** Between each exercise, draw a thin gray dashed line from the endpoint of the previous route to the start of the next route
- **D-14:** Transitions are not separate ArenaRoute objects — they're drawn as connecting lines during rendering
- **D-15:** First exercise starts at A (entry), transitions flow naturally from each endpoint

### Arena visualization (ROUTE-04)
- **D-16:** Replace the freehand ArenaEditor with a read-only ArenaRouteView component
- **D-17:** Color-coded routes per gait using existing GAIT_COLORS
- **D-18:** Exercise labels (short name or number) displayed at the midpoint of each route
- **D-19:** Skridt routes drawn dashed (existing pattern from ArenaCanvas.drawPath)
- **D-20:** Start dot and end arrow on each route (existing pattern)
- **D-21:** "Generér nye ruter" button to regenerate with new random seed
- **D-22:** Keep the existing ArenaCanvas component for rendering — refactor to accept auto-generated routes

### Claude's Discretion
- Exact bezier curve control points for different exercise types
- How many intermediate points to use for smooth curves
- Volte circle approximation (how many points for a smooth circle)
- Exact label positioning to avoid overlaps
- Whether to extract ARENA_LETTERS_60 to a shared module or import from ArenaCanvas

</decisions>

<specifics>
## Specific Ideas

- CHOREOGRAPHY-RULES.md §6 table is the definitive mapping of exercise type → route location
- Existing ArenaCanvas already has ARENA_LETTERS_60 with normalized positions, drawPath with start dots and end arrows, dashed lines for skridt — reuse all of this
- The route generator needs to classify exercises by type (extension, halvpas, volte, etc.) based on the exercise name — similar to how program-generator.ts detects pairs by name normalization
- Current ArenaEditor is a freehand drawing tool — Phase 5 replaces the drawing interaction with auto-generated routes but keeps the canvas rendering

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Route principles
- `.planning/CHOREOGRAPHY-RULES.md` §2 — Strength/weakness placement zones in arena
- `.planning/CHOREOGRAPHY-RULES.md` §6 — Route templates per exercise type (the definitive table)

### Existing arena code
- `src/components/ArenaCanvas.tsx` — Canvas renderer with ARENA_LETTERS_60, PathPoint, ArenaPath types, drawPath function, gait colors
- `src/components/ArenaEditor.tsx` — Current freehand editor (will be replaced/refactored)
- `src/components/ArenaThumbnail.tsx` — Thumbnail renderer (may need update)

### Data model
- `src/data/kur-levels.ts` — Exercise type with name, gait, coefficient, minDistance
- `src/lib/program-generator.ts` — Generates the programOrder that routes visualize
- `src/lib/types/project.ts` — ArenaPath imported from ArenaCanvas, stored in project data

### Prior phase decisions
- `.planning/phases/03-intelligent-program-generator/03-CONTEXT.md` — D-17 to D-20: seeded PRNG pattern (reuse for route randomization)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ARENA_LETTERS_60` in ArenaCanvas.tsx — all arena letter positions normalized 0-1 (A, K, V, E, S, H, C, M, R, B, P, F, X, D, L, I, G)
- `PathPoint` and `ArenaPath` types in ArenaCanvas.tsx
- `ArenaCanvas.drawPath()` — draws colored paths with start dots and end arrows, dashed for skridt
- `GAIT_COLORS` and `GAIT_LABELS` from kur-levels.ts
- `mulberry32` and `fisherYatesShuffle` from program-generator.ts — reuse for route randomization
- Existing vitest + jsdom test infrastructure

### Established Patterns
- Pure route generation function in src/lib/ (matching program-generator.ts and rule-validator.ts)
- Seeded PRNG via options parameter for deterministic testing
- ArenaCanvas renders based on ArenaPath[] prop — can accept auto-generated routes directly

### Integration Points
- `page.tsx` arena step (line 233-264): Currently uses ArenaEditor — will use new ArenaRouteView
- `ArenaPath[]` stored in wizard-store via `setArenaPaths` — auto-generated routes feed into same storage
- `ArenaThumbnail.tsx` — reads ArenaPath[] for project cards, should work with auto-generated routes

</code_context>

<deferred>
## Deferred Ideas

- User editing/adjusting routes — Phase 6 (EDIT-02)
- 20x40 arena support — v2 (ARENA-01)
- Route animation/playback — future backlog
- Actual distance measurement for lateral movements — future (currently advisory only)

</deferred>

---

*Phase: 05-auto-generated-arena-routes*
*Context gathered: 2026-03-22*
