# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` — `ArenaCanvas.tsx`, `ExerciseList.tsx`, `MusicManager.tsx`
- Lib utilities: kebab-case, `.ts` — `bpm-detect.ts`, `audio-mixer.ts`
- Data modules: kebab-case, `.ts` — `kur-levels.ts`, `strength-options.ts`
- Pages: `page.tsx`, `layout.tsx` (Next.js App Router convention)

**Functions:**
- React components: PascalCase — `export function ArenaCanvas(...)`, `export function MusicManager(...)`
- Utility functions: camelCase — `generateMixTimeline`, `detectBPM`, `bpmMatchesGait`, `audioBufferToWav`
- Event handlers: `handle` prefix — `handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `handleFileUpload`, `handleMix`
- Local helper functions within components: camelCase, non-exported — `generateProgram`, `drawPath`, `writeString`

**Variables and Constants:**
- Module-level data constants: SCREAMING_SNAKE_CASE — `KUR_LEVELS`, `GAIT_COLORS`, `GAIT_LABELS`, `STEPS`, `STEP_LABELS`, `RATING_OPTIONS`, `TEMPERAMENT_OPTIONS`, `MUSIC_GENRES`
- Local variables: camelCase — `programOrder`, `mixSegments`, `currentExercise`
- Boolean state: noun + adjective — `isDrawing`, `mixing`, `mixReady`

**Types and Interfaces:**
- Interfaces: PascalCase — `Exercise`, `KurLevel`, `ArenaPath`, `MixTrack`, `MixSegment`
- Type aliases: PascalCase — `Gait`, `StrengthRating`, `Step`
- Component prop interfaces: always named `Props` (local to each file) — `interface Props { ... }`
- Union string types used extensively for domain values: `"calm" | "neutral" | "energetic"`, `"strength" | "neutral" | "weakness"`

## Code Style

**Formatting:**
- No Prettier config present; relies on ESLint for enforcement
- 2-space indentation (consistent throughout all files)
- Double quotes for JSX string attributes
- Trailing commas in multi-line objects/arrays

**Linting:**
- ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config: `eslint.config.mjs`
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- No `any` usage detected in source files

## Import Organization

**Order (consistent across files):**
1. React and Next.js framework imports — `import { useState, useRef } from "react"`
2. Type imports from local data modules — `import type { KurLevel } from "@/data/kur-levels"`
3. Value imports from local data modules — `import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels"`
4. Local component imports — `import { ArenaCanvas } from "./ArenaCanvas"`
5. Local lib imports — `import { detectBPM } from "@/lib/bpm-detect"`

**`type` keyword:** `import type` is used consistently for type-only imports throughout all files.

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Data imports: `@/data/kur-levels`, `@/data/strength-options`
- Lib imports: `@/lib/bpm-detect`, `@/lib/audio-mixer`
- Component imports from sibling files use relative `./ComponentName`

## Component Design

**Structure:**
- All components are named exports (not default exports), except the Next.js page (`export default function Home()`) and layout
- Props destructured directly in function signature: `export function LevelSelector({ levels, onSelect }: Props)`
- `Props` interface always defined immediately above the function
- `"use client"` directive placed at the very top of files that use React hooks or browser APIs — `ArenaCanvas.tsx`, `ArenaEditor.tsx`, `MusicManager.tsx`, `src/app/page.tsx`
- Components without hooks/browser APIs have no directive (server-compatible by default)

**Hooks usage:**
- `useState` for local state
- `useCallback` wrapping all event handlers that are passed as props (prevents unnecessary re-renders)
- `useRef` for DOM element references (canvas, audio element, file input)
- `useEffect` for side effects driven by memoized callbacks

**Inline functions:**
- Small, non-reused handlers defined inline in JSX — `onClick={() => setStep(s)}`
- Handlers with meaningful logic extracted to `useCallback` at component top

## Styling

**Approach:** Tailwind CSS v4 utility classes only. No custom CSS classes.
- `src/app/globals.css` only configures Tailwind import and CSS custom properties
- Inline `style` prop used only when dynamic values are needed (e.g., `style={{ backgroundColor: GAIT_COLORS[gait] }}`)
- Standard Tailwind color palette used: `gray-*`, `blue-*`, `green-*`, `red-*`, `yellow-*`, `amber-*`, `purple-*`
- Responsive prefix `sm:` used selectively for grid layouts
- Interactive states: `hover:*` and `disabled:opacity-50` inline

## Error Handling

**Async operations:**
- `try/catch` blocks used for all async browser API calls (`AudioContext`, `decodeAudioData`, `renderMix`)
- Inner try/catch used for optional sub-operations that can fail silently (BPM detection inside `handleFileUpload`)
- Error state stored in component state: `error?: string` field on `UploadedTrack` — displayed inline in UI
- `console.error` used for unexpected failures: `console.error("Mix failed:", err)` in `MusicManager.tsx`
- Empty catch blocks used when failure is acceptable: `catch { // BPM detection can fail on some files }`

**Guard clauses:**
- Early returns on null/undefined refs: `if (!canvas) return;`, `if (!ctx) return;`
- `if (!files) return;` pattern for optional DOM values

## Data Logic

**Pure functions outside components:**
- Program ordering logic lives in standalone functions: `generateProgramOrder` in `src/app/page.tsx`, `generateProgram` in `src/components/ProgramPreview.tsx` (note: duplicated)
- These functions take data as arguments and return derived data — no side effects

**Constants as data:**
- Domain data stored in `src/data/` as exported TypeScript constants
- Label/color lookup maps are typed `Record<Gait, string>` etc.: `GAIT_COLORS`, `GAIT_LABELS`

## Comments

**When to Comment:**
- Inline comments explain non-obvious logic: `// Throttle points to avoid too many`, `// BPM detection can fail on some files`, `// Loop if track is shorter than segment`
- Section separators used in large JSX blocks: `{/* Forbidden movements */}`, `{/* Mix timeline preview */}`
- Comments explain business rules: `// Entry is always first`, `// Calm horse: can start with skridt...`

**JSDoc/TSDoc:**
- Not used. No JSDoc annotations found anywhere in the codebase.

## Module Design

**Exports:**
- Named exports throughout all component and lib files
- Default export only for Next.js required entry points (`layout.tsx`, `page.tsx`, `next.config.ts`)
- No barrel `index.ts` files; imports always point to the specific file

**Data modules (`src/data/`):**
- Export both types/interfaces and runtime constants from the same file
- Example: `kur-levels.ts` exports `KurLevel` (interface), `Gait` (type), `KUR_LEVELS` (data), `GAIT_COLORS` (lookup), `GAIT_LABELS` (lookup)
