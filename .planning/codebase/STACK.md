# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- CSS - Global styles via Tailwind utility classes (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` or `.node-version` file)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router (`src/app/`)
- React 19.2.3 - UI library (`src/components/`, `src/app/page.tsx`)
- React DOM 19.2.3 - DOM rendering

**Build/Dev:**
- Tailwind CSS 4.x - Utility-first CSS (`postcss.config.mjs`, `src/app/globals.css`)
- `@tailwindcss/postcss` ^4 - PostCSS integration for Tailwind v4
- PostCSS - CSS processing (`postcss.config.mjs`)
- ESLint 9.x - Linting (`eslint.config.mjs`)
- `eslint-config-next` 16.1.6 - Next.js ESLint rules including core-web-vitals and TypeScript

## Key Dependencies

**Critical:**
- `web-audio-beat-detector` ^8.2.35 - BPM detection from uploaded audio files; used in `src/lib/bpm-detect.ts` via dynamic import `await import("web-audio-beat-detector")`

**Browser APIs (no npm package):**
- `AudioContext` / `OfflineAudioContext` - Audio decoding, rendering, and mixing; used in `src/lib/audio-mixer.ts` and `src/lib/bpm-detect.ts`
- `Canvas 2D API` - Arena drawing; used in `src/components/ArenaCanvas.tsx`
- `Blob` / `URL.createObjectURL` - WAV file generation and download; used in `src/lib/audio-mixer.ts` and `src/components/MusicManager.tsx`

## Configuration

**TypeScript:**
- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Module resolution: bundler
- Config: `tsconfig.json`

**Build:**
- Next.js config: `next.config.ts` (minimal, no custom options set)
- PostCSS config: `postcss.config.mjs`

**Linting:**
- ESLint config: `eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

**Font:**
- Geist Sans via `next/font/google` (loaded in `src/app/layout.tsx`)

## Platform Requirements

**Development:**
- Node.js with npm
- Run: `npm run dev` (Next.js dev server)

**Production:**
- Run: `npm run build && npm start`
- Purely client-side app logic (no API routes detected); can be deployed as static export or standard Next.js host
- All audio processing runs in the browser (Web Audio API)

---

*Stack analysis: 2026-03-20*
