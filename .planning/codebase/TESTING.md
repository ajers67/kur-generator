# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Not configured. No test runner (Jest, Vitest, Playwright, Cypress) is present in the project.
- No test config files found (`jest.config.*`, `vitest.config.*`)
- No test scripts in `package.json` (`scripts` contains only `dev`, `build`, `start`, `lint`)

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands are configured
npm run lint    # Only quality check available
npm run build   # Type-checking via next build
```

## Test File Organization

**Location:**
- No test files exist in the project. Zero `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files found.

**Naming:**
- No convention established.

## Test Coverage

**Requirements:** None enforced. No coverage tooling configured.

## What Exists Instead of Tests

**Type safety:**
- TypeScript strict mode (`"strict": true` in `tsconfig.json`) provides compile-time correctness guarantees
- All domain types are explicitly typed: `Gait`, `KurLevel`, `Exercise`, `StrengthRating`, `ArenaPath`
- `import type` used consistently to prevent accidental runtime imports

**Lint:**
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run with: `npm run lint`
- Config: `eslint.config.mjs`

**Stub component:**
- `src/components/ArenaPreview.tsx` is a placeholder stub (`export function ArenaPreview() { return null; }`) indicating planned but unimplemented functionality

## Testable Units (if tests were added)

The following are pure functions with no side effects that would be straightforward to unit test:

**`src/lib/bpm-detect.ts`**
- `bpmMatchesGait(bpm: number, gait: string)` — pure function, no I/O
- Takes BPM number and gait string, returns `{ match: boolean; ideal: string; diff: number }`

**`src/lib/audio-mixer.ts`**
- `generateMixTimeline(tracks, exercises, totalDurationSec)` — pure function
- `audioBufferToWav(buffer: AudioBuffer)` — pure function (depends on Web Audio API types)

**`src/app/page.tsx`**
- `generateProgramOrder(level, ratings, temperament)` — pure function, no I/O
- Returns ordered `Exercise[]` based on temperament logic

**`src/components/ProgramPreview.tsx`**
- `generateProgram(level, ratings, temperament)` — pure function (duplicates logic from `page.tsx`)

## Recommended Testing Setup (if adding tests)

**Framework:** Vitest is recommended for this Next.js + TypeScript stack.

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Config file to create:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Test file placement:** Co-locate with source files:
- `src/lib/bpm-detect.test.ts`
- `src/lib/audio-mixer.test.ts`
- `src/components/LevelSelector.test.tsx`

**Example pattern for pure function tests:**
```typescript
import { describe, it, expect } from "vitest";
import { bpmMatchesGait } from "@/lib/bpm-detect";

describe("bpmMatchesGait", () => {
  it("returns match for trav BPM in range", () => {
    const result = bpmMatchesGait(80, "trav");
    expect(result.match).toBe(true);
  });

  it("returns no match for BPM far out of range", () => {
    const result = bpmMatchesGait(40, "trav");
    expect(result.match).toBe(false);
  });
});
```

**Example pattern for component tests:**
```typescript
import { render, screen } from "@testing-library/react";
import { LevelSelector } from "@/components/LevelSelector";
import { KUR_LEVELS } from "@/data/kur-levels";

describe("LevelSelector", () => {
  it("renders all levels", () => {
    render(<LevelSelector levels={KUR_LEVELS} onSelect={vi.fn()} />);
    expect(screen.getByText("LA Kür (Sværhedsgrad 1)")).toBeInTheDocument();
  });
});
```

## Current Quality Risk

Because no tests exist, the highest-risk untested areas are:

1. **`generateProgramOrder` / `generateProgram` duplication** — same logic exists in two places (`src/app/page.tsx` and `src/components/ProgramPreview.tsx`). Bugs in one will not surface in the other without tests.

2. **`bpmMatchesGait` edge cases** — half-time/double-time BPM logic is complex with potential off-by-one issues at range boundaries.

3. **`generateMixTimeline`** — segment boundary calculation (crossfade durations, first/last segment special cases) is not validated.

4. **`audioBufferToWav`** — WAV header byte packing is error-prone and completely untested.
