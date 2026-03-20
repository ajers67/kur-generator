<!-- GSD:project-start source:PROJECT.md -->
## Project

**FreestyleMaker**

En intelligent kür-designer til dressurryttere. Systemet genererer et komplet freestyle-program — rækkefølge, ruter i banen og musik — baseret på hestens styrker/svagheder og anerkendte koreografi-principper. Rytteren kan tilpasse forslaget, og systemet validerer løbende at reglerne overholdes. Målgruppen er danske dressurryttere på alle niveauer.

**Core Value:** Rytteren får et professionelt kür-forslag med ruter og musik — genereret på sekunder, ikke uger — som de kan tilpasse og gøre til deres eget.

### Constraints

- **API**: Google Lyria er gratis men eksperimentel — MusicProvider-abstraktion
- **Client-side**: Al logik kører i browseren
- **Regelmotor**: Validering skal køre real-time mens brugeren tilpasser
- **Variation**: Generatoren må ikke producere identisk program for samme input — indbyg kontrolleret randomisering
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)
- CSS - Global styles via Tailwind utility classes (`src/app/globals.css`)
## Runtime
- Node.js (version not pinned; no `.nvmrc` or `.node-version` file)
- npm
- Lockfile: present (`package-lock.json`)
## Frameworks
- Next.js 16.1.6 - Full-stack React framework with App Router (`src/app/`)
- React 19.2.3 - UI library (`src/components/`, `src/app/page.tsx`)
- React DOM 19.2.3 - DOM rendering
- Tailwind CSS 4.x - Utility-first CSS (`postcss.config.mjs`, `src/app/globals.css`)
- `@tailwindcss/postcss` ^4 - PostCSS integration for Tailwind v4
- PostCSS - CSS processing (`postcss.config.mjs`)
- ESLint 9.x - Linting (`eslint.config.mjs`)
- `eslint-config-next` 16.1.6 - Next.js ESLint rules including core-web-vitals and TypeScript
## Key Dependencies
- `web-audio-beat-detector` ^8.2.35 - BPM detection from uploaded audio files; used in `src/lib/bpm-detect.ts` via dynamic import `await import("web-audio-beat-detector")`
- `AudioContext` / `OfflineAudioContext` - Audio decoding, rendering, and mixing; used in `src/lib/audio-mixer.ts` and `src/lib/bpm-detect.ts`
- `Canvas 2D API` - Arena drawing; used in `src/components/ArenaCanvas.tsx`
- `Blob` / `URL.createObjectURL` - WAV file generation and download; used in `src/lib/audio-mixer.ts` and `src/components/MusicManager.tsx`
## Configuration
- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Module resolution: bundler
- Config: `tsconfig.json`
- Next.js config: `next.config.ts` (minimal, no custom options set)
- PostCSS config: `postcss.config.mjs`
- ESLint config: `eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Geist Sans via `next/font/google` (loaded in `src/app/layout.tsx`)
## Platform Requirements
- Node.js with npm
- Run: `npm run dev` (Next.js dev server)
- Run: `npm run build && npm start`
- Purely client-side app logic (no API routes detected); can be deployed as static export or standard Next.js host
- All audio processing runs in the browser (Web Audio API)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase, `.tsx` — `ArenaCanvas.tsx`, `ExerciseList.tsx`, `MusicManager.tsx`
- Lib utilities: kebab-case, `.ts` — `bpm-detect.ts`, `audio-mixer.ts`
- Data modules: kebab-case, `.ts` — `kur-levels.ts`, `strength-options.ts`
- Pages: `page.tsx`, `layout.tsx` (Next.js App Router convention)
- React components: PascalCase — `export function ArenaCanvas(...)`, `export function MusicManager(...)`
- Utility functions: camelCase — `generateMixTimeline`, `detectBPM`, `bpmMatchesGait`, `audioBufferToWav`
- Event handlers: `handle` prefix — `handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `handleFileUpload`, `handleMix`
- Local helper functions within components: camelCase, non-exported — `generateProgram`, `drawPath`, `writeString`
- Module-level data constants: SCREAMING_SNAKE_CASE — `KUR_LEVELS`, `GAIT_COLORS`, `GAIT_LABELS`, `STEPS`, `STEP_LABELS`, `RATING_OPTIONS`, `TEMPERAMENT_OPTIONS`, `MUSIC_GENRES`
- Local variables: camelCase — `programOrder`, `mixSegments`, `currentExercise`
- Boolean state: noun + adjective — `isDrawing`, `mixing`, `mixReady`
- Interfaces: PascalCase — `Exercise`, `KurLevel`, `ArenaPath`, `MixTrack`, `MixSegment`
- Type aliases: PascalCase — `Gait`, `StrengthRating`, `Step`
- Component prop interfaces: always named `Props` (local to each file) — `interface Props { ... }`
- Union string types used extensively for domain values: `"calm" | "neutral" | "energetic"`, `"strength" | "neutral" | "weakness"`
## Code Style
- No Prettier config present; relies on ESLint for enforcement
- 2-space indentation (consistent throughout all files)
- Double quotes for JSX string attributes
- Trailing commas in multi-line objects/arrays
- ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config: `eslint.config.mjs`
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- No `any` usage detected in source files
## Import Organization
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Data imports: `@/data/kur-levels`, `@/data/strength-options`
- Lib imports: `@/lib/bpm-detect`, `@/lib/audio-mixer`
- Component imports from sibling files use relative `./ComponentName`
## Component Design
- All components are named exports (not default exports), except the Next.js page (`export default function Home()`) and layout
- Props destructured directly in function signature: `export function LevelSelector({ levels, onSelect }: Props)`
- `Props` interface always defined immediately above the function
- `"use client"` directive placed at the very top of files that use React hooks or browser APIs — `ArenaCanvas.tsx`, `ArenaEditor.tsx`, `MusicManager.tsx`, `src/app/page.tsx`
- Components without hooks/browser APIs have no directive (server-compatible by default)
- `useState` for local state
- `useCallback` wrapping all event handlers that are passed as props (prevents unnecessary re-renders)
- `useRef` for DOM element references (canvas, audio element, file input)
- `useEffect` for side effects driven by memoized callbacks
- Small, non-reused handlers defined inline in JSX — `onClick={() => setStep(s)}`
- Handlers with meaningful logic extracted to `useCallback` at component top
## Styling
- `src/app/globals.css` only configures Tailwind import and CSS custom properties
- Inline `style` prop used only when dynamic values are needed (e.g., `style={{ backgroundColor: GAIT_COLORS[gait] }}`)
- Standard Tailwind color palette used: `gray-*`, `blue-*`, `green-*`, `red-*`, `yellow-*`, `amber-*`, `purple-*`
- Responsive prefix `sm:` used selectively for grid layouts
- Interactive states: `hover:*` and `disabled:opacity-50` inline
## Error Handling
- `try/catch` blocks used for all async browser API calls (`AudioContext`, `decodeAudioData`, `renderMix`)
- Inner try/catch used for optional sub-operations that can fail silently (BPM detection inside `handleFileUpload`)
- Error state stored in component state: `error?: string` field on `UploadedTrack` — displayed inline in UI
- `console.error` used for unexpected failures: `console.error("Mix failed:", err)` in `MusicManager.tsx`
- Empty catch blocks used when failure is acceptable: `catch { // BPM detection can fail on some files }`
- Early returns on null/undefined refs: `if (!canvas) return;`, `if (!ctx) return;`
- `if (!files) return;` pattern for optional DOM values
## Data Logic
- Program ordering logic lives in standalone functions: `generateProgramOrder` in `src/app/page.tsx`, `generateProgram` in `src/components/ProgramPreview.tsx` (note: duplicated)
- These functions take data as arguments and return derived data — no side effects
- Domain data stored in `src/data/` as exported TypeScript constants
- Label/color lookup maps are typed `Record<Gait, string>` etc.: `GAIT_COLORS`, `GAIT_LABELS`
## Comments
- Inline comments explain non-obvious logic: `// Throttle points to avoid too many`, `// BPM detection can fail on some files`, `// Loop if track is shorter than segment`
- Section separators used in large JSX blocks: `{/* Forbidden movements */}`, `{/* Mix timeline preview */}`
- Comments explain business rules: `// Entry is always first`, `// Calm horse: can start with skridt...`
- Not used. No JSDoc annotations found anywhere in the codebase.
## Module Design
- Named exports throughout all component and lib files
- Default export only for Next.js required entry points (`layout.tsx`, `page.tsx`, `next.config.ts`)
- No barrel `index.ts` files; imports always point to the specific file
- Export both types/interfaces and runtime constants from the same file
- Example: `kur-levels.ts` exports `KurLevel` (interface), `Gait` (type), `KUR_LEVELS` (data), `GAIT_COLORS` (lookup), `GAIT_LABELS` (lookup)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- All state lives in a single root page component (`src/app/page.tsx`)
- No server-side data fetching — all data is static, hardcoded in `src/data/`
- No routing — a local `step` state variable drives which view renders
- No external API calls — all computation (program ordering, BPM detection, audio mixing) runs in the browser
- One-way data flow: root page owns all state, passes values and callbacks down to leaf components
## Layers
- Purpose: Domain types and hardcoded rule data
- Location: `src/data/`
- Contains: TypeScript types, exported arrays/records of domain constants
- Depends on: Nothing
- Used by: Components, page
- Purpose: Domain algorithms with no React dependency
- Location: `src/lib/`
- Contains: BPM detection (`bpm-detect.ts`), audio rendering/mixing (`audio-mixer.ts`)
- Depends on: Browser Web Audio API, `web-audio-beat-detector` npm package
- Used by: `MusicManager` component
- Purpose: Rendered views for each wizard step
- Location: `src/components/`
- Contains: One React component per file, named export
- Depends on: `src/data/`, `src/lib/`, each other (ArenaEditor uses ArenaCanvas)
- Used by: Root page
- Purpose: Wizard state machine, step routing, program generation algorithm
- Location: `src/app/page.tsx`
- Contains: All shared state, `generateProgramOrder()` function, step-switching logic
- Depends on: All components, all data modules
- Used by: Next.js router (single route `/`)
## Data Flow
- All state via `useState` hooks in `src/app/page.tsx`
- No context, no external state library
- Child components receive state as props and call callback props to mutate it
- `arenaPaths` state is lifted to root but currently only passed into `ArenaEditor` via `onPathsChange` — not consumed elsewhere
## Key Abstractions
- Purpose: Represents a dressage freestyle competition level with its full ruleset
- Examples: `src/data/kur-levels.ts` — exported `KUR_LEVELS` array
- Pattern: Plain TypeScript interface with nested arrays; levels are static data, not fetched
- Purpose: A single required movement within a level
- Examples: Inline objects in `KUR_LEVELS[n].exercises`
- Pattern: `{ id, name, gait, coefficient, minDistance?, description? }`
- Purpose: A freehand drawing path on the arena canvas for one exercise
- Examples: `src/components/ArenaCanvas.tsx` — exported `ArenaPath` interface
- Pattern: `{ points: PathPoint[], gait, exerciseId, exerciseName }`
- Purpose: Audio mixing timeline primitives
- Examples: `src/lib/audio-mixer.ts`
- Pattern: Pure data objects; no React dependency; used by `generateMixTimeline()` and `renderMix()`
- Purpose: Identifies the active wizard step
- Examples: `src/app/page.tsx` — `STEPS` tuple and `Step` type
- Pattern: `"level" | "profile" | "exercises" | "preview" | "arena" | "music"` — drives conditional rendering
## Entry Points
- Location: `src/app/page.tsx`
- Triggers: Next.js App Router renders this as the `/` route
- Responsibilities: Owns all application state, renders header + progress bar + active step component
- Location: `src/app/layout.tsx`
- Triggers: Wraps all pages automatically by Next.js App Router
- Responsibilities: Sets `<html lang="da">`, loads Geist font, applies globals CSS
## Error Handling
- BPM detection failures are caught in `MusicManager.handleFileUpload` and set `track.error` string for display
- Audio file read failures set `track.error = "Kunne ikke læse filen"`
- `renderMix()` throws if no segments/tracks; caller in `MusicManager.handleMix` logs to `console.error` but shows no user error UI
- No global error boundary
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
