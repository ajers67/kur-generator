# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Single-page wizard application with client-side state management

**Key Characteristics:**
- All state lives in a single root page component (`src/app/page.tsx`)
- No server-side data fetching — all data is static, hardcoded in `src/data/`
- No routing — a local `step` state variable drives which view renders
- No external API calls — all computation (program ordering, BPM detection, audio mixing) runs in the browser
- One-way data flow: root page owns all state, passes values and callbacks down to leaf components

## Layers

**Data Layer (static):**
- Purpose: Domain types and hardcoded rule data
- Location: `src/data/`
- Contains: TypeScript types, exported arrays/records of domain constants
- Depends on: Nothing
- Used by: Components, page

**Library Layer (pure utilities):**
- Purpose: Domain algorithms with no React dependency
- Location: `src/lib/`
- Contains: BPM detection (`bpm-detect.ts`), audio rendering/mixing (`audio-mixer.ts`)
- Depends on: Browser Web Audio API, `web-audio-beat-detector` npm package
- Used by: `MusicManager` component

**Component Layer (UI):**
- Purpose: Rendered views for each wizard step
- Location: `src/components/`
- Contains: One React component per file, named export
- Depends on: `src/data/`, `src/lib/`, each other (ArenaEditor uses ArenaCanvas)
- Used by: Root page

**Page Layer (orchestrator):**
- Purpose: Wizard state machine, step routing, program generation algorithm
- Location: `src/app/page.tsx`
- Contains: All shared state, `generateProgramOrder()` function, step-switching logic
- Depends on: All components, all data modules
- Used by: Next.js router (single route `/`)

## Data Flow

**Wizard progression:**

1. User selects a `KurLevel` in `LevelSelector` → root page sets `selectedLevel` and advances to `profile` step
2. User fills horse name, temperament, music preference in `HorseProfileForm` → root page updates individual state fields
3. User rates exercises in `ExerciseList` → root page updates `exerciseRatings` map (exerciseId → StrengthRating)
4. Root page computes `programOrder` via `generateProgramOrder(selectedLevel, exerciseRatings, temperament)` — recalculated on every render
5. `ProgramPreview` displays the ordered program (has its own duplicate `generateProgram` function — see CONCERNS.md)
6. `ArenaEditor` receives `programOrder`, user draws paths per exercise, lifts `ArenaPath[]` up to root via `onPathsChange`
7. `MusicManager` receives `programOrder`, user uploads audio files, BPM detection runs via `detectBPM()` from `src/lib/bpm-detect.ts`, mix is rendered client-side via `renderMix()` from `src/lib/audio-mixer.ts`, output is a downloadable WAV blob

**State Management:**
- All state via `useState` hooks in `src/app/page.tsx`
- No context, no external state library
- Child components receive state as props and call callback props to mutate it
- `arenaPaths` state is lifted to root but currently only passed into `ArenaEditor` via `onPathsChange` — not consumed elsewhere

## Key Abstractions

**KurLevel:**
- Purpose: Represents a dressage freestyle competition level with its full ruleset
- Examples: `src/data/kur-levels.ts` — exported `KUR_LEVELS` array
- Pattern: Plain TypeScript interface with nested arrays; levels are static data, not fetched

**Exercise:**
- Purpose: A single required movement within a level
- Examples: Inline objects in `KUR_LEVELS[n].exercises`
- Pattern: `{ id, name, gait, coefficient, minDistance?, description? }`

**ArenaPath:**
- Purpose: A freehand drawing path on the arena canvas for one exercise
- Examples: `src/components/ArenaCanvas.tsx` — exported `ArenaPath` interface
- Pattern: `{ points: PathPoint[], gait, exerciseId, exerciseName }`

**MixSegment / MixTrack:**
- Purpose: Audio mixing timeline primitives
- Examples: `src/lib/audio-mixer.ts`
- Pattern: Pure data objects; no React dependency; used by `generateMixTimeline()` and `renderMix()`

**Step:**
- Purpose: Identifies the active wizard step
- Examples: `src/app/page.tsx` — `STEPS` tuple and `Step` type
- Pattern: `"level" | "profile" | "exercises" | "preview" | "arena" | "music"` — drives conditional rendering

## Entry Points

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: Next.js App Router renders this as the `/` route
- Responsibilities: Owns all application state, renders header + progress bar + active step component

**Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps all pages automatically by Next.js App Router
- Responsibilities: Sets `<html lang="da">`, loads Geist font, applies globals CSS

## Error Handling

**Strategy:** Minimal — errors are silently swallowed in most cases

**Patterns:**
- BPM detection failures are caught in `MusicManager.handleFileUpload` and set `track.error` string for display
- Audio file read failures set `track.error = "Kunne ikke læse filen"`
- `renderMix()` throws if no segments/tracks; caller in `MusicManager.handleMix` logs to `console.error` but shows no user error UI
- No global error boundary

## Cross-Cutting Concerns

**Logging:** `console.error` only on mix failure — no structured logging
**Validation:** None — no form validation on horse name, no guard on empty program before proceeding
**Authentication:** Not applicable — fully client-side, no user accounts

---

*Architecture analysis: 2026-03-20*
