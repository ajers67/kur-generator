---
phase: 04-rule-validation-engine
verified: 2026-03-22T20:30:00Z
status: gaps_found
score: 8/9 must-haves verified
re_verification: false
gaps:
  - truth: "Zero issues shows green checkmark with 'Programmet overholder reglerne'"
    status: failed
    reason: "ValidationBanner shows green state only when results.length === 0, but valid programs always emit min-distance warnings for exercises with minDistance. A valid LA/LA6 program will always show the amber warnings panel, never the green success state. The success condition should check errors.length === 0, not results.length === 0."
    artifacts:
      - path: "src/components/ValidationBanner.tsx"
        issue: "Line 11: `if (results.length === 0)` should be `if (errors.length === 0)` to show success when no rule violations exist (warnings are advisory only)"
    missing:
      - "Change success condition in ValidationBanner from `results.length === 0` to `errors.length === 0` so that warning-only programs still show the green success state"
human_verification:
  - test: "Open app, select a level, fill horse profile and ratings, reach ProgramPreview step"
    expected: "ValidationBanner renders above the program table. Valid auto-generated program shows green checkmark (after the bug fix above). If an exercise is removed from programOrder manually, a red error badge appears."
    why_human: "Cannot verify visual rendering, badge color, and expandable details/summary behavior programmatically"
---

# Phase 4: Rule Validation Engine Verification Report

**Phase Goal:** System validates FEI/DRF rules in real-time and shows clear errors/warnings
**Verified:** 2026-03-22T20:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Missing obligatory exercises detected with specific error messages | VERIFIED | `checkMissingExercises` in rule-validator.ts line 11–30; message pattern `{name} mangler i programmet`; test cases pass |
| 2 | Exercises not in the level's exercise list are flagged as forbidden | VERIFIED | `checkForbiddenExercises` in rule-validator.ts line 33–52; message pattern `{name} er ikke tilladt på dette niveau`; test passes |
| 3 | Lateral movements with minDistance get advisory warnings | VERIFIED | `checkMinDistance` in rule-validator.ts line 55–72; severity="warning"; 2 test cases pass |
| 4 | Entry not first or halt not last produces an error | VERIFIED | `checkEntryAndFinalePosition` in rule-validator.ts line 75–124; "entry-position" and "finale-position" rules; 2 test cases pass |
| 5 | A valid program produces zero validation errors | VERIFIED | Test "returns no errors for valid LA program" passes (checks errors array, not full results) |
| 6 | Errors shown as red badge with count and expandable violation list | VERIFIED | ValidationBanner.tsx lines 24–42: `bg-red-50`, `bg-red-600` badge, `<details open>` with `<ul>` of messages |
| 7 | Warnings shown as yellow/amber badge with count and expandable list | VERIFIED | ValidationBanner.tsx lines 44–62: `bg-amber-50`, `bg-amber-500` badge, `<details>` collapsed by default |
| 8 | Zero issues shows green checkmark with 'Programmet overholder reglerne' | FAILED | ValidationBanner line 11 checks `results.length === 0`, but valid programs always emit min-distance warnings — the green state is unreachable in practice |
| 9 | Validation recomputes automatically when programOrder or level changes | VERIFIED | ProgramPreview.tsx lines 23–26: `useMemo(() => validateProgram(level, program), [level, program])` |

**Score:** 8/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/rule-validator.ts` | Pure validateProgram function and ValidationResult type | VERIFIED | 144 lines, exports `validateProgram` and `ValidationResult`, no React dependency |
| `src/lib/__tests__/rule-validator.test.ts` | Test coverage for all validation rules, min 80 lines | VERIFIED | 193 lines, 10 test cases, all pass |
| `src/components/ValidationBanner.tsx` | Validation UI component, min 40 lines | VERIFIED | 65 lines, exports `ValidationBanner`, three visual states (with caveat — see gaps) |
| `src/components/ProgramPreview.tsx` | Program preview with integrated validation banner | VERIFIED | Contains `validateProgram` call, `useMemo`, and `<ValidationBanner>` rendering |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/rule-validator.ts` | `src/data/kur-levels.ts` | `import type { KurLevel, Exercise }` | VERIFIED | Line 1 of rule-validator.ts |
| `src/components/ProgramPreview.tsx` | `src/lib/rule-validator.ts` | `import validateProgram` + `useMemo` call | VERIFIED | Lines 8, 23–26 of ProgramPreview.tsx |
| `src/components/ValidationBanner.tsx` | `src/lib/rule-validator.ts` | `import type { ValidationResult }` | VERIFIED | Line 1 of ValidationBanner.tsx |
| `src/components/ProgramPreview.tsx` | `src/components/ValidationBanner.tsx` | `import ValidationBanner` + JSX render | VERIFIED | Lines 9, 46 of ProgramPreview.tsx |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| RULE-01 | 04-01 | Alle obligatoriske øvelser valideres | SATISFIED | `checkMissingExercises` + test "detects missing obligatory exercise" |
| RULE-02 | 04-01 | Laterale bevægelser min 12 meter | SATISFIED | `checkMinDistance` emits warning for `exercise.minDistance`; test "warns about lateral movement minimum distance" passes |
| RULE-03 | 04-01 | Advarer ved øvelser fra højere niveau | SATISFIED | `checkForbiddenExercises` + test "flags exercise not in level's exercise list" |
| RULE-04 | 04-02 | Valideringsstatus som tydelige fejl/advarsler i UI | PARTIAL | Red/amber/green states exist and render correctly; however the green "no errors" state is broken (see gap — uses `results.length === 0` instead of `errors.length === 0`) |
| RULE-05 | 04-02 | Validering kører real-time ved hver bruger-ændring | SATISFIED | `useMemo([level, program])` in ProgramPreview recomputes on every level or program change |

**Orphaned requirements:** None. All five RULE-01 through RULE-05 are claimed by plans in this phase and verified above.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ValidationBanner.tsx` | 11 | `if (results.length === 0)` — wrong success condition | Warning | Green success state is unreachable for any level with lateral exercises (all levels have at least one exercise with `minDistance`). Users never see "Programmet overholder reglerne" even when their program has zero violations. |

No TODO/FIXME comments, no stub returns, no hardcoded empty data in any of the four files. The anti-pattern above is a logic error, not a placeholder stub.

---

### Human Verification Required

#### 1. Visual rendering of ValidationBanner states

**Test:** Open the app, select a level (e.g., LA6), complete all wizard steps to reach ProgramPreview.
**Expected:** ValidationBanner appears above the program table. Since the valid auto-generated program has min-distance warnings, an amber section shows with "X advarsler". No red section shows (zero errors).
**Why human:** Cannot verify Tailwind rendering, badge placement, or details/summary expand behavior from static analysis.

#### 2. Green success state (blocked by gap)

**Test:** After fixing `results.length === 0` to `errors.length === 0` in ValidationBanner.tsx, verify the green checkmark and text "Programmet overholder reglerne" appears when there are only warnings (no errors).
**Why human:** Requires UI interaction after code fix.

---

### Gaps Summary

One gap blocks full goal achievement:

**Green success state unreachable.** Plan 04-01 correctly noted that valid programs always emit `severity="warning"` results for exercises with `minDistance` (advisory). This was an explicit decision in the SUMMARY's "Auto-fixed Issues" section. However, the ValidationBanner UI component was not updated to match this contract — it checks `results.length === 0` for the green state, but should check `errors.length === 0`.

The fix is a single-line change in `src/components/ValidationBanner.tsx` line 11:

```tsx
// Current (broken for valid programs with warnings):
if (results.length === 0) {

// Correct (green when no rule violations, regardless of advisory warnings):
if (errors.length === 0) {
```

All other must-haves are fully verified. The validation engine (04-01) is complete and correct. The UI integration (04-02) is complete except for this one condition check.

---

_Verified: 2026-03-22T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
