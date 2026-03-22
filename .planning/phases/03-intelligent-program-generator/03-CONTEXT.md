# Phase 3: Intelligent Program Generator - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild `generateProgramOrder()` so it produces exercise ordering based on real choreography principles from CHOREOGRAPHY-RULES.md. The function takes level, ratings, and temperament as input and returns an ordered exercise list. No UI changes, no arena routes, no validation engine — just the ordering algorithm and its tests.

</domain>

<decisions>
## Implementation Decisions

### Musical arc structure
- **D-01:** Program divided into 5 sections: Entry, Build-up, Climax, Wind-down, Finale
- **D-02:** Entry = indridning (always first). Finale = halt/hilsen (always last). These are hard-locked.
- **D-03:** Climax section placed in the last third of the program (strongest impression on judges)
- **D-04:** Build-up uses moderate exercises, climax gets the hardest/highest-coefficient exercises
- **D-05:** Wind-down inserts a skridt section (recovery pause) between climax and finale

### Strength/weakness placement logic
- **D-06:** Strength-rated exercises are placed in prominent arc positions (climax, late build-up)
- **D-07:** Weakness-rated exercises are placed in early build-up or wind-down (less prominent)
- **D-08:** High-coefficient exercises (coefficient >= 2) get priority placement in climax regardless of rating
- **D-09:** If an exercise is both high-coefficient AND weakness — place in build-up (not hidden, but not climax spotlight either)

### Temperament-driven gait sequencing
- **D-10:** Calm horse: skridt early -> trav -> galop (gradual warm-up)
- **D-11:** Energetic horse: trav -> galop early -> skridt as mid-program pause -> remaining galop
- **D-12:** Neutral horse: trav -> skridt -> galop (balanced)
- **D-13:** Passage/piaffe (when present at higher levels) always in climax section

### Symmetry handling
- **D-14:** Left/right exercise pairs (e.g., "volte til venstre" / "volte til hojre") are detected by matching names
- **D-15:** Pairs are placed close together but NOT adjacent — interleave with 1-2 other exercises
- **D-16:** Stronger side of a pair placed first (if one is strength-rated)

### Controlled randomization
- **D-17:** Within each arc section, exercise order is shuffled using Fisher-Yates
- **D-18:** Shuffle respects constraints: entry first, finale last, pairs stay close, gait sequence preserved
- **D-19:** Optional seed parameter for reproducibility in tests
- **D-20:** No external RNG library — use a simple seeded PRNG (mulberry32 or similar)

### API contract
- **D-21:** Same function signature: `generateProgramOrder(level, ratings, temperament, options?)`
- **D-22:** New optional `options` parameter: `{ seed?: number }` for deterministic output in tests
- **D-23:** Return type stays `Exercise[]` — no breaking changes to consumers
- **D-24:** Function remains pure (no side effects, no store access)

### Claude's Discretion
- Exact scoring formula for combining strength rating + coefficient + arc position
- How many exercises fit in each arc section (proportional to total count)
- Edge cases: levels with very few exercises (LA has 14) vs many (Grand Prix)
- Whether to extract sub-functions or keep as one module

</decisions>

<specifics>
## Specific Ideas

- CHOREOGRAPHY-RULES.md section 9 lists anti-patterns: avoid simple "strengths first" sorting, avoid identical programs, avoid all weaknesses at the end — the algorithm must actively prevent these
- Current `sortByStrength` in program-generator.ts is exactly the anti-pattern we're replacing
- The "element of surprise and adventure" principle (section 8) means the shuffle is a feature, not a bug
- Passage/piaffe are "showpiece" exercises at higher levels — they belong in the climax section near C

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Choreography principles
- `.planning/CHOREOGRAPHY-RULES.md` — The authoritative source for all ordering rules. Every section is relevant, especially:
  - Section 1: Musical arc structure (intro -> build -> climax -> wind-down -> finish)
  - Section 2: Strength/weakness placement in the arena (strength toward C, weakness in corners)
  - Section 3: Coefficient weighting (choreography has highest coefficient of 4)
  - Section 4: Temperament strategy (calm/energetic/neutral gait ordering)
  - Section 5: Symmetry and balance (left/right distribution)
  - Section 8: Variation and creativity (controlled randomization, multiple variants)
  - Section 9: Anti-patterns (what NOT to do)

### Existing code
- `src/lib/program-generator.ts` — Current implementation to replace (47 lines, simple sort)
- `src/data/kur-levels.ts` — Exercise data model, all 7 DRF levels with exercises, coefficients, gaits
- `src/data/strength-options.ts` — StrengthRating type definition
- `src/lib/types/project.ts` — ProjectData type (programOrder stored as `number[]`)

### Consumers of generateProgramOrder
- `src/app/page.tsx:50-52` — Calls `generateProgramOrder(selectedLevel, exerciseRatings, temperament)`
- `src/components/ProgramPreview.tsx:16` — Calls same function independently

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `generateProgramOrder()` in `src/lib/program-generator.ts` — replace internals, keep signature
- `Exercise` and `KurLevel` types in `src/data/kur-levels.ts` — exercise.gait, exercise.coefficient, exercise.name are the key fields
- `StrengthRating` type ("strength" | "neutral" | "weakness") from `src/data/strength-options.ts`
- Existing test infrastructure: vitest + jsdom configured, tests in `__tests__/` directories

### Established Patterns
- Pure functions in `src/lib/` with no React dependency
- Named exports (not default)
- Types imported from `@/data/` and `@/data/strength-options`
- Tests use vitest with `describe`/`it` blocks

### Integration Points
- `page.tsx` line 50-52: Calls generator and syncs result to store via `setProgramOrder`
- `ProgramPreview.tsx` line 16: Calls generator independently for display
- Both callers use same 3 args — adding optional 4th `options` param is backwards-compatible
- `programOrder` stored in wizard-store as `number[]` (exercise IDs) — no change needed

</code_context>

<deferred>
## Deferred Ideas

- Arena route placement (strength toward C, weakness in corners) — Phase 5, not Phase 3. Phase 3 only handles ordering.
- Rule validation (missing exercises, forbidden exercises) — Phase 4
- Re-generate button in UI — Phase 6 (EDIT-03)
- "Explain why" feature showing the reasoning behind placement — future backlog item

</deferred>

---

*Phase: 03-intelligent-program-generator*
*Context gathered: 2026-03-22*
