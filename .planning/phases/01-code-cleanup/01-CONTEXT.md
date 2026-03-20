# Phase 1: Code Cleanup - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Deduplicate the program generation algorithm and remove dead code. Pure refactoring — no new features, no behavior changes. Steps 1-5 must work identically after cleanup.

</domain>

<decisions>
## Implementation Decisions

### Program generation deduplication
- **D-01:** Extract generateProgramOrder() from page.tsx into src/lib/program-generator.ts as a single shared function
- **D-02:** Both page.tsx and ProgramPreview.tsx must import from the shared module — delete their local copies
- **D-03:** The extracted function signature must match the existing interface (level, ratings, temperament) -> Exercise[]

### Dead code removal
- **D-04:** Delete ArenaPreview.tsx (stub returning null) and its import in page.tsx
- **D-05:** Delete HorseProfile interface from strength-options.ts (unused, conflicts with actual state shape)
- **D-06:** Remove musicPreference state from page.tsx and its prop in HorseProfileForm (collected but never used)
- **D-07:** Remove unused trackIndex variable from MusicManager.tsx handleFileUpload

### Claude's Discretion
- Exact function signature and type exports in program-generator.ts
- Whether to also export helper functions (sortByStrength etc.) or keep them module-private

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Codebase references
- `src/app/page.tsx` lines 27-70 — generateProgramOrder() (primary copy)
- `src/components/ProgramPreview.tsx` lines 14-70 — generateProgram() (duplicate copy)
- `src/components/ArenaPreview.tsx` — stub component to delete
- `src/data/strength-options.ts` — contains unused HorseProfile interface

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Both generateProgramOrder() and generateProgram() contain identical sorting/dedup logic that can be extracted as-is

### Established Patterns
- Lib modules in src/lib/ use named exports, kebab-case filenames
- Pure functions with no React dependency belong in src/lib/

### Integration Points
- page.tsx imports and calls generateProgramOrder() on every render (useMemo candidate but out of scope)
- ProgramPreview receives level/ratings/temperament as props and calls its own copy

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard refactoring approach.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-code-cleanup*
*Context gathered: 2026-03-20*
