# Phase 1: Code Cleanup - Research

**Researched:** 2026-03-20
**Domain:** TypeScript/React refactoring -- function extraction and dead code removal
**Confidence:** HIGH

## Summary

This phase is a straightforward refactoring task with no external dependencies, no new libraries, and no architecture changes. The codebase has two identical copies of the program generation algorithm (one in `src/app/page.tsx` lines 27-70, one in `src/components/ProgramPreview.tsx` lines 14-70) that must be extracted to a shared module. Additionally, four pieces of dead code must be removed.

All changes are mechanical and verifiable by diffing function bodies and running the build. The primary risk is subtle behavioral divergence between the two copies -- but code review confirms they are functionally identical (same logic, same variable names, minor comment differences only).

**Primary recommendation:** Extract the function as-is from page.tsx into `src/lib/program-generator.ts`, update both import sites, then delete the four dead code items. Verify with `npm run build` and `npm run lint`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Extract generateProgramOrder() from page.tsx into src/lib/program-generator.ts as a single shared function
- **D-02:** Both page.tsx and ProgramPreview.tsx must import from the shared module -- delete their local copies
- **D-03:** The extracted function signature must match the existing interface (level, ratings, temperament) -> Exercise[]
- **D-04:** Delete ArenaPreview.tsx (stub returning null) and its import in page.tsx
- **D-05:** Delete HorseProfile interface from strength-options.ts (unused, conflicts with actual state shape)
- **D-06:** Remove musicPreference state from page.tsx and its prop in HorseProfileForm (collected but never used)
- **D-07:** Remove unused trackIndex variable from MusicManager.tsx handleFileUpload

### Claude's Discretion
- Exact function signature and type exports in program-generator.ts
- Whether to also export helper functions (sortByStrength etc.) or keep them module-private

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | generateProgramOrder() er deduplikeret til en funktion i src/lib/program-generator.ts | Code review confirms two identical copies exist (page.tsx:27-70, ProgramPreview.tsx:14-70). Extract-and-import is the correct approach. |
| QUAL-02 | Dead code fjernet: ArenaPreview stub, ubrugt HorseProfile type, ubrugt musicPreference, ubrugt trackIndex | All four items verified as genuinely dead code -- see Dead Code Inventory below. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses only existing tooling:

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5 | Type checking ensures refactored imports resolve correctly |
| ESLint | ^9 | Catches unused imports/variables after dead code removal |
| Next.js build | 16.1.6 | Full compilation verifies no broken imports |

**Verification commands:**
```bash
npm run build    # TypeScript compilation + Next.js bundle
npm run lint     # ESLint catches unused imports
```

## Architecture Patterns

### Recommended Module Structure for program-generator.ts

Following existing project conventions (kebab-case lib files, named exports, pure functions in `src/lib/`):

```
src/lib/program-generator.ts    # NEW -- single source of truth
src/lib/audio-mixer.ts          # existing
src/lib/bpm-detect.ts           # existing
```

### Pattern: Extract Pure Function to Lib Module

**What:** Move a pure function (no React dependency, no side effects) from a component file to `src/lib/`.

**When to use:** When multiple components need the same computation.

**Implementation:**

```typescript
// src/lib/program-generator.ts
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

export function generateProgramOrder(
  level: KurLevel,
  ratings: Record<number, StrengthRating>,
  temperament: "calm" | "neutral" | "energetic"
): Exercise[] {
  // ... exact logic from page.tsx lines 32-69
}
```

**Key design decision (Claude's discretion):** The `sortByStrength` helper is only used internally -- keep it module-private (not exported). This keeps the public API surface minimal and matches the existing pattern in `audio-mixer.ts` where internal helpers are not exported.

### Import Pattern at Call Sites

```typescript
// In page.tsx
import { generateProgramOrder } from "@/lib/program-generator";

// In ProgramPreview.tsx
import { generateProgramOrder } from "@/lib/program-generator";
```

Both files already import from `@/data/kur-levels` and `@/data/strength-options`, so the type imports for the function parameters are already available at each call site.

### Anti-Patterns to Avoid
- **Re-exporting from a barrel file:** The project has no `index.ts` barrel files. Do not create one.
- **Changing the function signature:** D-03 locks the signature. Do not "improve" it by e.g. accepting an options object.
- **Moving types along with the function:** `Exercise`, `KurLevel`, `StrengthRating` stay in their current locations (`@/data/`). The new module imports them, it does not re-export them.

## Dead Code Inventory

Verified dead code items with full dependency analysis:

### 1. ArenaPreview.tsx (D-04)
- **File:** `src/components/ArenaPreview.tsx` -- 4 lines, returns null
- **Imports:** Zero. Grep for "ArenaPreview" across `src/` shows only the file itself. It is NOT imported in page.tsx or anywhere else.
- **Action:** Delete the entire file. No imports to clean up.

### 2. HorseProfile Interface (D-05)
- **Location:** `src/data/strength-options.ts` lines 3-17
- **Usage:** Grep confirms it is defined but never imported anywhere. The actual state shape in page.tsx uses separate `useState` hooks for each field, not this interface.
- **Action:** Delete lines 3-17 from strength-options.ts. Keep `StrengthRating`, `TEMPERAMENT_OPTIONS`, and `MUSIC_GENRES` exports intact.
- **Note on MUSIC_GENRES:** Although `musicPreference` state is being removed (D-06), `MUSIC_GENRES` is still imported by `HorseProfileForm`. However, once D-06 removes the music preference UI from HorseProfileForm, `MUSIC_GENRES` will become unused too. It should be removed from strength-options.ts AND the import in HorseProfileForm should be cleaned up.

### 3. musicPreference State (D-06)
- **Defined:** `src/app/page.tsx` line 78 -- `const [musicPreference, setMusicPreference] = useState("");`
- **Passed to:** `HorseProfileForm` as `musicPreference` and `setMusicPreference` props (page.tsx lines 134-135)
- **Used in HorseProfileForm:** Props interface (lines 8-9), destructured (line 19), genre selection UI (lines 67-88)
- **Consumed downstream:** Never. No other component reads `musicPreference`.
- **Action requires changes in TWO files:**
  1. `page.tsx`: Remove `useState` declaration, remove props from `<HorseProfileForm>` JSX
  2. `HorseProfileForm.tsx`: Remove from Props interface, remove from destructuring, remove entire "Musikpraference" UI section (lines 67-88), remove `MUSIC_GENRES` import
- **Cascade:** After removing the genre UI, `MUSIC_GENRES` export in `strength-options.ts` becomes unused. Clean it up too.

### 4. trackIndex Variable (D-07)
- **Location:** `src/components/MusicManager.tsx` line 59 -- `const trackIndex = tracks.length;`
- **Usage:** Assigned but never read. The `trackIndex` on line 318 (`tracks[seg.trackIndex]`) is a DIFFERENT variable -- it reads from `seg.trackIndex` (a property of `MixSegment`), not the local variable.
- **Action:** Delete line 59 only. No other changes needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying no regressions | Manual testing each step | `npm run build` + `npm run lint` | TypeScript compiler catches broken imports; ESLint catches unused variables |
| Comparing function bodies | Visual diff | Side-by-side diff of the two functions | The two copies are confirmed identical in logic; only comments differ |

## Common Pitfalls

### Pitfall 1: Forgetting the MUSIC_GENRES Cascade
**What goes wrong:** Removing `musicPreference` from HorseProfileForm but leaving the `MUSIC_GENRES` import and the genre selection JSX, or leaving the `MUSIC_GENRES` export in strength-options.ts.
**Why it happens:** D-06 says "remove musicPreference" but the genre selection UI and its data source are technically separate items.
**How to avoid:** Trace the full dependency chain: state -> prop -> UI -> data constant. Remove all of them.
**Warning signs:** ESLint warns about unused imports if `MUSIC_GENRES` is left imported.

### Pitfall 2: Breaking ProgramPreview Props
**What goes wrong:** ProgramPreview currently calls its local `generateProgram()` using its own props. After switching to the shared import, forgetting to pass the correct arguments.
**Why it happens:** The local function and the shared function have the same signature, but the component already has the values as props -- just need to call the import with the same args.
**How to avoid:** The call site in ProgramPreview line 73 already does `generateProgram(level, ratings, temperament)` -- just change the function name to `generateProgramOrder` (matching the shared export name).
**Warning signs:** TypeScript will error if argument types don't match.

### Pitfall 3: Removing musicPreference from page.tsx Without Removing from HorseProfileForm
**What goes wrong:** Build fails because HorseProfileForm still expects `musicPreference` and `setMusicPreference` props.
**Why it happens:** Changes span two files -- easy to do one and forget the other.
**How to avoid:** Change both files in the same task/commit.
**Warning signs:** TypeScript error on missing required props.

## Code Examples

### Extracted program-generator.ts (verified from source)

```typescript
// src/lib/program-generator.ts
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

export function generateProgramOrder(
  level: KurLevel,
  ratings: Record<number, StrengthRating>,
  temperament: "calm" | "neutral" | "energetic"
): Exercise[] {
  const exercises = [...level.exercises];
  const skridt = exercises.filter((e) => e.gait === "skridt");
  const trav = exercises.filter((e) => e.gait === "trav");
  const galop = exercises.filter((e) => e.gait === "galop");
  const overgang = exercises.filter((e) => e.gait === "overgang");
  const passage = exercises.filter((e) => e.gait === "passage");
  const piaffe = exercises.filter((e) => e.gait === "piaffe");

  const sortByStrength = (a: Exercise, b: Exercise) => {
    const order: Record<StrengthRating, number> = { strength: 0, neutral: 1, weakness: 2 };
    return (order[ratings[a.id] || "neutral"]) - (order[ratings[b.id] || "neutral"]);
  };

  trav.sort(sortByStrength);
  galop.sort(sortByStrength);

  const entryExercise = overgang.find((e) => e.name.includes("Indridning"));
  const restOvergang = overgang.filter((e) => !e.name.includes("Indridning"));

  let program: Exercise[] = [];
  if (entryExercise) program.push(entryExercise);

  if (temperament === "calm") {
    program = [...program, ...skridt, ...trav, ...galop];
  } else if (temperament === "energetic") {
    program = [...program, ...trav, ...galop.slice(0, Math.ceil(galop.length / 2)), ...skridt, ...galop.slice(Math.ceil(galop.length / 2))];
  } else {
    program = [...program, ...trav, ...skridt, ...galop];
  }

  program = [...program, ...passage, ...piaffe, ...restOvergang];

  const seen = new Set<number>();
  return program.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}
```

### Updated page.tsx import (replacing local function)

```typescript
// Remove lines 27-70 (the local generateProgramOrder function)
// Add import:
import { generateProgramOrder } from "@/lib/program-generator";
```

### Updated ProgramPreview.tsx import (replacing local function)

```typescript
// Remove lines 14-70 (the local generateProgram function)
// Add import:
import { generateProgramOrder } from "@/lib/program-generator";

// Update call site (line 73):
const program = generateProgramOrder(level, ratings, temperament);
```

### Cleaned HorseProfileForm.tsx Props

```typescript
// Remove MUSIC_GENRES from import
import { TEMPERAMENT_OPTIONS } from "@/data/strength-options";

interface Props {
  horseName: string;
  setHorseName: (name: string) => void;
  temperament: "calm" | "neutral" | "energetic";
  setTemperament: (t: "calm" | "neutral" | "energetic") => void;
  onNext: () => void;
  onBack: () => void;
}
// Remove musicPreference and setMusicPreference from Props and destructuring
// Remove entire "Musikpraference" section (lines 67-88)
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | None |
| Quick run command | `npm run build` (TypeScript compilation) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | generateProgramOrder exists in one location and both call sites use it | build + grep | `npm run build` (verifies imports resolve) | N/A -- build is the test |
| QUAL-02 | Dead code removed from codebase | build + lint | `npm run lint` (catches unused imports/vars) | N/A -- lint is the test |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Full build + lint green before verification

### Wave 0 Gaps
None -- no test framework needed for this phase. The TypeScript compiler and ESLint serve as the verification tools. The refactoring is purely structural (move code, delete code) with no behavioral changes to test.

## Open Questions

1. **Should MUSIC_GENRES be removed from strength-options.ts?**
   - What we know: After removing musicPreference UI from HorseProfileForm, nothing imports MUSIC_GENRES.
   - What's unclear: Future phases might use MUSIC_GENRES (Phase 3 involves music generation with genre selection).
   - Recommendation: Remove it now. If Phase 3 needs it, it can be re-added in the appropriate location (it's 9 lines of data). Dead code should not be kept "just in case."

## Sources

### Primary (HIGH confidence)
- Direct codebase reading of all affected files
- Grep-verified dependency analysis across entire `src/` directory

### Confidence Assessment
All findings are HIGH confidence -- this is a pure codebase analysis with no external dependencies, no API lookups, and no version ambiguity. Every claim was verified by reading the actual source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, existing build tools only
- Architecture: HIGH - Following established project conventions (verified in CLAUDE.md)
- Pitfalls: HIGH - All identified through direct code analysis
- Dead code inventory: HIGH - Every item verified with grep across entire src/

**Research date:** 2026-03-20
**Valid until:** Until codebase changes (stable -- no external dependencies)
