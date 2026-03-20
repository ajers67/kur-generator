# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
kur-generator/
├── src/
│   ├── app/
│   │   ├── page.tsx        # Root page — wizard orchestrator, all shared state
│   │   ├── layout.tsx      # App shell — html/body, font, metadata
│   │   ├── globals.css     # Tailwind base styles import
│   │   └── favicon.ico
│   ├── components/         # One component per file, named export
│   │   ├── LevelSelector.tsx
│   │   ├── HorseProfileForm.tsx
│   │   ├── ExerciseList.tsx
│   │   ├── ProgramPreview.tsx
│   │   ├── ArenaEditor.tsx    # Stateful wrapper around ArenaCanvas
│   │   ├── ArenaCanvas.tsx    # Pure canvas drawing primitive
│   │   ├── ArenaPreview.tsx   # Placeholder — returns null
│   │   └── MusicManager.tsx   # Audio upload, BPM detection, mix generation
│   ├── data/               # Static domain data and TypeScript types
│   │   ├── kur-levels.ts   # KurLevel[], Exercise, Gait types + GAIT_COLORS/LABELS
│   │   └── strength-options.ts  # StrengthRating, HorseProfile, TEMPERAMENT_OPTIONS, MUSIC_GENRES
│   └── lib/                # Pure utility functions, no React
│       ├── bpm-detect.ts   # detectBPM(), bpmMatchesGait()
│       └── audio-mixer.ts  # generateMixTimeline(), renderMix(), audioBufferToWav()
├── public/                 # Static assets (SVGs from Next.js default scaffold)
├── .planning/
│   └── codebase/           # GSD codebase analysis documents
├── next.config.ts          # Next.js config (empty defaults)
├── tsconfig.json           # TypeScript config — path alias @/ → ./src/
├── eslint.config.mjs
├── postcss.config.mjs      # Tailwind CSS v4 PostCSS plugin
├── package.json
└── DEVLOG.md               # Developer notes / changelog
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and global layout
- Contains: `page.tsx` (the only route), `layout.tsx`, CSS
- Key files: `src/app/page.tsx` — the entire wizard lives here

**`src/components/`:**
- Purpose: Isolated UI components, one per wizard step plus canvas primitives
- Contains: Named-export React components, all `"use client"` where state/effects needed
- Key files: `src/components/ArenaCanvas.tsx` (exports `ArenaPath`, `PathPoint` types used elsewhere)

**`src/data/`:**
- Purpose: Domain data and type definitions — the "model" layer
- Contains: Static arrays/records, exported TypeScript interfaces
- Key files: `src/data/kur-levels.ts` (primary domain types and all level data)

**`src/lib/`:**
- Purpose: Framework-agnostic utilities operating on browser APIs
- Contains: Pure async functions using Web Audio API
- Key files: `src/lib/audio-mixer.ts`, `src/lib/bpm-detect.ts`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Single application entry — wizard state machine and root render
- `src/app/layout.tsx`: HTML shell, font loading, global CSS

**Configuration:**
- `tsconfig.json`: Path alias `@/` maps to `src/` — use in all imports
- `next.config.ts`: Empty Next.js config, safe to add options here
- `postcss.config.mjs`: Tailwind CSS v4 via `@tailwindcss/postcss`

**Core Logic:**
- `src/app/page.tsx`: `generateProgramOrder()` — the program sequencing algorithm
- `src/lib/audio-mixer.ts`: `generateMixTimeline()`, `renderMix()`, `audioBufferToWav()`
- `src/lib/bpm-detect.ts`: `detectBPM()`, `bpmMatchesGait()`

**Domain Data:**
- `src/data/kur-levels.ts`: All competition levels, exercise definitions, gait colors/labels
- `src/data/strength-options.ts`: Strength rating type, temperament options, music genres

## Naming Conventions

**Files:**
- Components: PascalCase matching the exported component name — `ArenaEditor.tsx`
- Data modules: kebab-case — `kur-levels.ts`, `strength-options.ts`
- Lib utilities: kebab-case — `bpm-detect.ts`, `audio-mixer.ts`

**Directories:**
- Lowercase, singular: `app/`, `components/`, `data/`, `lib/`

**Exports:**
- Components: Named exports (`export function ComponentName`)
- Data: Named exports for arrays/records, named exports for types/interfaces
- Lib: Named exports for each utility function

**Types:**
- Interfaces: PascalCase — `KurLevel`, `Exercise`, `ArenaPath`
- Type aliases: PascalCase — `Gait`, `Step`, `StrengthRating`
- Constants: SCREAMING_SNAKE_CASE — `KUR_LEVELS`, `GAIT_COLORS`, `STEPS`

## Where to Add New Code

**New wizard step:**
- Add step key to `STEPS` tuple in `src/app/page.tsx`
- Add label to `STEP_LABELS` record in `src/app/page.tsx`
- Create component at `src/components/NewStepComponent.tsx`
- Add conditional render block in the return of `Home()` in `src/app/page.tsx`
- Wire state: add `useState` hooks in `src/app/page.tsx`, pass as props

**New competition level:**
- Add object to `KUR_LEVELS` array in `src/data/kur-levels.ts`
- Follow existing `KurLevel` interface — include `id`, `name`, `displayName`, `exercises`, `artisticMarks`, `forbidden`, `specialRules`

**New utility function:**
- Browser API / audio / compute work: add to `src/lib/` as a new file or extend existing
- Domain helpers (formatting, sorting): can live in `src/data/` near the types they operate on

**New component:**
- `src/components/ComponentName.tsx`
- Use named export: `export function ComponentName(...)`
- Add `"use client"` directive if using hooks or browser APIs
- Import data via `@/data/...`, lib via `@/lib/...`

**Shared types:**
- Domain types belong in `src/data/kur-levels.ts` or `src/data/strength-options.ts`
- Component-specific prop types are defined inline (interface `Props`) within the component file
- Types shared between components (e.g., `ArenaPath`) are defined in the component that "owns" them and imported by others

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents — phases, codebase analysis
- Generated: No
- Committed: Yes

**`public/`:**
- Purpose: Static files served at root — currently only Next.js scaffold SVGs
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-20*
