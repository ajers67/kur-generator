# Phase 4: Rule Validation Engine - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a validation engine that checks FEI/DRF rules against the current program and displays errors/warnings in the UI. Validation runs real-time on every program change. No editing capability (that's Phase 6), no arena routes (Phase 5) — just detection and display of rule violations.

</domain>

<decisions>
## Implementation Decisions

### Validation function design
- **D-01:** Pure function `validateProgram(level: KurLevel, programOrder: Exercise[]): ValidationResult[]`
- **D-02:** Lives in `src/lib/rule-validator.ts` — same pattern as `program-generator.ts` (pure, no React)
- **D-03:** Returns array of `ValidationResult` objects: `{ rule: string, severity: "error" | "warning", message: string, exerciseIds?: number[] }`
- **D-04:** "error" = hard rule violation (disqualification risk), "warning" = advisory (score deduction risk)

### Rule implementations (RULE-01 through RULE-03)
- **D-05:** RULE-01 (missing exercises): Compare `level.exercises` against `programOrder` — any exercise in level but not in program = error. Message includes the specific missing exercise name.
- **D-06:** RULE-02 (lateral min 12m): Check exercises with `minDistance` field. If exercise is in program but `minDistance` contains "12 meter" (or similar), emit warning reminding rider of minimum. This is advisory since we can't measure actual distance in Phase 4 (no arena routes yet).
- **D-07:** RULE-03 (forbidden exercises): Compare each exercise in program against `level.forbidden` rules. Since current data model stores forbidden rules as descriptions (not structured exercise IDs), this check compares against the level's exercise list — any exercise NOT in `level.exercises` that appears in the program = error.
- **D-08:** Additional rule: check that entry (Indridning) is first and halt/salute is last in the program — emit error if violated.

### UI display (RULE-04)
- **D-09:** Validation results shown as a banner/panel above the program list in ProgramPreview
- **D-10:** Errors: red badge with count + expandable list of specific violations
- **D-11:** Warnings: yellow/amber badge with count + expandable list
- **D-12:** When zero issues: green checkmark "Programmet overholder reglerne"
- **D-13:** Each violation message is in Danish, specific enough to act on ("Middelskridt mangler i programmet")

### Real-time execution (RULE-05)
- **D-14:** Validation runs inside ProgramPreview component via `useMemo` — recomputes when programOrder or level changes
- **D-15:** No debounce needed — pure function on small arrays (<20 exercises) runs in <1ms
- **D-16:** Validation also available in page.tsx for potential use by other steps (arena, music)

### Claude's Discretion
- Exact CSS styling of error/warning badges
- Whether to use collapsible sections or always-visible list for violations
- Whether ValidationResult needs additional fields (e.g., ruleId for filtering)
- Edge case handling for levels with unusual structures

</decisions>

<specifics>
## Specific Ideas

- CHOREOGRAPHY-RULES.md §7 is the authoritative rule source — all 6 rules listed there
- Current data model has `level.forbidden` as `ForbiddenRule[]` with `description` and `penalty` strings — not structured enough for automatic detection, so D-07 takes a practical approach
- `minDistance` field on Exercise is a string like "min. 20 meter" — parsing needed for D-06
- The auto-generated program from Phase 3 should always pass validation (entry first, all exercises present) — but user customization in Phase 6 could break rules, so the engine must catch violations

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation rules
- `.planning/CHOREOGRAPHY-RULES.md` §7 — The 6 hard FEI/DRF rules that MUST be validated

### Data model
- `src/data/kur-levels.ts` — KurLevel type with exercises[], forbidden[], specialRules[], timeMin/timeMax
- `src/data/kur-levels.ts:12-16` — ForbiddenRule interface: `{ description: string, penalty: string }`
- `src/data/kur-levels.ts:1-10` — Exercise interface with `minDistance?: string` field

### Existing code
- `src/lib/program-generator.ts` — Generates the programOrder that validation checks against
- `src/components/ProgramPreview.tsx` — Component where validation UI will be displayed
- `src/app/page.tsx` — Root page that passes programOrder to ProgramPreview

### Prior phase decisions
- `.planning/phases/03-intelligent-program-generator/03-CONTEXT.md` — Phase 3 guarantees entry first/finale last and all exercises present in generated output

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KurLevel` type has `exercises`, `forbidden`, `specialRules` — all needed for validation
- `Exercise` type has `id`, `name`, `gait`, `coefficient`, `minDistance` — validation can use all fields
- Existing test infrastructure (vitest + jsdom) ready for validator tests
- `program-generator.ts` pattern: pure function in `src/lib/`, named export, TypeScript strict

### Established Patterns
- Pure functions in `src/lib/` with no React dependency
- Types imported from `@/data/kur-levels`
- `useMemo` used in components for derived data
- Danish UI text throughout (lang="da")

### Integration Points
- `ProgramPreview.tsx` line 16: already calls `generateProgramOrder()` — add `validateProgram()` call alongside
- `ProgramPreview.tsx` line 21-33: existing summary section — validation banner fits above the program table
- `page.tsx` line 50-52: computes programOrder — could also compute validation here and pass down

</code_context>

<deferred>
## Deferred Ideas

- Time validation (program within timeMin/timeMax) — requires arena routes with durations (Phase 5+)
- Combination proximity check ("within few meters") — requires arena routes (Phase 5)
- Real lateral distance measurement — requires arena routes (Phase 5)
- Auto-fix suggestions ("Add missing exercise") — Phase 6 (user customization)

</deferred>

---

*Phase: 04-rule-validation-engine*
*Context gathered: 2026-03-22*
