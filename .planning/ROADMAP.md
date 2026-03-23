# Roadmap: FreestyleMaker (Intelligent Kur-Designer)

## Overview

FreestyleMaker pivoterer fra et simpelt planlaegningsvaerktoj til en intelligent kur-designer. Systemet genererer komplette freestyle-programmer med ruter og musik baseret pa koreografi-principper og hestens styrker/svagheder. Brugeren kan tilpasse alt, og systemet validerer reglerne lobende.

Koreografi-principper er dokumenteret i `.planning/CHOREOGRAPHY-RULES.md` -- den autoritative kilde for programgenerering.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-03-23)
- 🚧 **v2.0 Arena Animation & Video Preview** - Phases 9-11 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 MVP (Phases 1-8) - SHIPPED 2026-03-23</summary>

- [x] **Phase 1: Code Cleanup** - Deduplicate program generation and remove dead code
- [x] **Phase 2: Wizard Persistence** - Save wizard state so work survives page refresh
- [x] **Phase 3: Intelligent Program Generator** - Rebuild program ordering based on choreography principles
- [x] **Phase 4: Rule Validation Engine** - Real-time validation of FEI/DRF rules
- [x] **Phase 5: Auto-generated Arena Routes** - Generate visual routes in the arena for each exercise
- [x] **Phase 6: User Customization** - Drag-and-drop editing of program order and routes
- [x] **Phase 7: Lyria Music Generation** - Generate per-gait music via Google Lyria API
- [x] **Phase 8: Mix Pipeline & Music Persistence** - Combine gait tracks and persist all data

### Phase 1: Code Cleanup
**Goal**: Codebase has a single source of truth for program generation and no dead code
**Status**: Complete (2026-03-20)
**Requirements**: QUAL-01, QUAL-02

Plans:
- [x] 01-01-PLAN.md — Extract generateProgramOrder to shared module
- [x] 01-02-PLAN.md — Remove dead code

### Phase 2: Wizard Persistence
**Goal**: Riders can close the browser or refresh at any point and resume exactly where they left off
**Depends on**: Phase 1
**Requirements**: PERS-01, PERS-03, PERS-04
**Success Criteria**:
  1. Wizard data (level, horse profile, ratings) survives page refresh
  2. Arena data survives page refresh
  3. Explicit "Start forfra" clears all saved state
  4. Clean first-load behavior (no hydration errors)

Plans:
- [x] 02-01-PLAN.md — Install zustand, create types, stores, and persistence helpers
- [x] 02-02-PLAN.md — Create project selector UI and refactor page.tsx to use stores
- [x] 02-03-PLAN.md — Install vitest and write persistence tests

### Phase 3: Intelligent Program Generator
**Goal**: System generates exercise ordering based on real choreography principles from CHOREOGRAPHY-RULES.md
**Depends on**: Phase 2
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06
**Success Criteria**:
  1. Generated program places strength-rated exercises in prominent positions (toward C, diagonals)
  2. Weakness-rated exercises are placed in less visible positions (corners, short sides)
  3. High-coefficient exercises get better placement than low-coefficient
  4. Program follows musical arc (calm start -> build -> climax -> finish)
  5. Same input produces varied results across multiple generations
  6. Entry always first, halt/salute always last, symmetry maintained

Plans:
- [x] 03-01-PLAN.md — TDD: Build intelligent program generator with arc structure, placement, symmetry, and randomization
- [x] 03-02-PLAN.md — Add temperament gait-ordering tests for PROG-03 coverage

### Phase 4: Rule Validation Engine
**Goal**: System validates FEI/DRF rules in real-time and shows clear errors/warnings
**Depends on**: Phase 3
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05
**Success Criteria**:
  1. Missing obligatory exercises flagged with specific error messages
  2. Lateral movements under 12m flagged
  3. Higher-level exercises flagged as forbidden
  4. Validation runs on every program change without perceptible delay
  5. Errors/warnings displayed clearly in UI (red/yellow badges)

Plans:
- [x] 04-01-PLAN.md — TDD: Build pure validateProgram function with tests for all FEI/DRF rules
- [x] 04-02-PLAN.md — Create ValidationBanner component and integrate into ProgramPreview

### Phase 5: Auto-generated Arena Routes
**Goal**: System generates visual routes in the 20x60 arena for each exercise, connected with transitions
**Depends on**: Phase 4
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04
**Success Criteria**:
  1. Each exercise has auto-generated route appropriate for its type (extensions on diagonals, laterals along track)
  2. Strength exercises route toward C-end, weakness exercises in less visible zones
  3. Routes connected with transition lines between exercises
  4. Arena view shows all routes color-coded by gait with exercise labels

Plans:
- [x] 05-01-PLAN.md — TDD: Build generateRoutes pure function with exercise type classification and route templates
- [x] 05-02-PLAN.md — Create ArenaRouteView component and integrate into arena step

### Phase 6: User Customization
**Goal**: Riders can customize the generated program to make it their own while staying within rules
**Depends on**: Phase 5
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria**:
  1. User can drag exercises to reorder in program list
  2. User can adjust/move routes in arena view
  3. ~~User can regenerate entire program with one click~~ (REMOVED)
  4. All changes update both program list and arena view in real-time
  5. Rule validation runs after every edit

Plans:
- [x] 06-01-PLAN.md — Add customProgramOrder to state and drag-and-drop reordering to ProgramPreview
- [x] 06-02-PLAN.md — Add route selection and drag-move interaction to ArenaCanvas

### Phase 7: Lyria Music Generation
**Goal**: Riders can generate custom music for each gait with correct BPM, preview it, and iterate
**Depends on**: Phase 6
**Requirements**: MUS-01, MUS-02, MUS-03, MUS-04, MUS-05
**Success Criteria**:
  1. Per-gait music generation with auto-BPM (walk 60-72, trot 140-160, canter 100-120)
  2. Genre/mood/style prompt control
  3. In-browser playback preview
  4. Re-generate any gait track
  5. Animated progress indicator during generation

Plans:
- [x] 07-01-PLAN.md — MusicProvider abstraction, Lyria server proxy, and PCM-to-WAV conversion
- [x] 07-02-PLAN.md — Rewrite MusicManager UI for AI generation with playback and controls

### Phase 8: Mix Pipeline & Music Persistence
**Goal**: Combine gait tracks into one downloadable kur file, persist everything
**Depends on**: Phase 7
**Requirements**: MIX-01, MIX-02, MIX-03, PERS-02
**Success Criteria**:
  1. All gait tracks combined into one audio file with coefficient-weighted durations
  2. Downloadable audio file output
  3. Generated music persists in IndexedDB across sessions
  4. "Start forfra" clears music cache too

Plans:
- [x] 08-01-PLAN.md — IndexedDB music persistence with load/save and Start forfra cleanup
- [x] 08-02-PLAN.md — Coefficient-weighted mix pipeline and Download kur button

</details>

### 🚧 v2.0 Arena Animation & Video Preview (In Progress)

**Milestone Goal:** Rytteren kan se en animeret preview af sit kur-program — hest+rytter ikon der folger ruterne i banen, synkroniseret med musikken, med fulde playback-kontroller.

- [ ] **Phase 9: Arena Animation Engine** - Pure animation logic: horse marker follows routes with gait-correct speed and colors
- [ ] **Phase 10: Playback Controls & Music Sync** - Play/pause/seek controls with music-animation synchronization
- [ ] **Phase 11: Video Preview Mode** - Fullscreen preview with timeline and program-step entry point

## Phase Details

### Phase 9: Arena Animation Engine
**Goal**: Users see a horse+rider marker animate through their program routes at gait-appropriate speeds with color coding
**Depends on**: Phase 8 (requires generated routes and program order)
**Requirements**: ANIM-01, ANIM-02, ANIM-04
**Success Criteria** (what must be TRUE):
  1. A horse+rider marker moves along the generated arena routes from entry to final halt
  2. The marker speed visually differs between gaits (walk is noticeably slower than canter)
  3. The marker color changes to match the current gait using the existing GAIT_COLORS mapping
  4. The animation renders on the existing ArenaCanvas without breaking route display
**Plans:** 2 plans

Plans:
- [x] 09-01-PLAN.md — Animation timeline model + useAnimationPlayer hook (pure logic + tests)
- [x] 09-02-PLAN.md — Canvas marker rendering + ArenaRouteView integration + visual verification

### Phase 10: Playback Controls & Music Sync
**Goal**: Users can control animation playback and hear synchronized music that matches the current gait
**Depends on**: Phase 9
**Requirements**: ANIM-03, PLAY-01, PLAY-02, PLAY-03, PLAY-04
**Success Criteria** (what must be TRUE):
  1. Play/pause button starts and stops both animation and music simultaneously
  2. A seek slider allows jumping to any point in the program — animation and music both jump
  3. Speed control (0.5x, 1x, 1.5x, 2x) affects both animation speed and music playback rate
  4. The currently playing exercise is highlighted in the program list during playback
  5. When animation crosses a gait boundary, the music switches to the correct gait track
**Plans**: TBD

### Phase 11: Video Preview Mode
**Goal**: Users can launch a dedicated fullscreen preview that shows the complete animated kur with timeline
**Depends on**: Phase 10
**Requirements**: VID-01, VID-02, VID-03
**Success Criteria** (what must be TRUE):
  1. An "Afspil kur" button is visible and accessible from the program preview step
  2. Clicking it opens a fullscreen preview mode with the arena animation and music playing
  3. A visual timeline bar shows exercise segments with gait colors and exercise labels
  4. The user can exit fullscreen preview and return to the editor
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Code Cleanup | v1.0 | 2/2 | Complete | 2026-03-20 |
| 2. Wizard Persistence | v1.0 | 3/3 | Complete | 2026-03-21 |
| 3. Intelligent Program Generator | v1.0 | 2/2 | Complete | 2026-03-22 |
| 4. Rule Validation Engine | v1.0 | 2/2 | Complete | 2026-03-22 |
| 5. Auto-generated Arena Routes | v1.0 | 2/2 | Complete | 2026-03-22 |
| 6. User Customization | v1.0 | 2/2 | Complete | 2026-03-22 |
| 7. Lyria Music Generation | v1.0 | 2/2 | Complete | 2026-03-23 |
| 8. Mix Pipeline & Music Persistence | v1.0 | 2/2 | Complete | 2026-03-23 |
| 9. Arena Animation Engine | v2.0 | 0/2 | Planned | - |
| 10. Playback Controls & Music Sync | v2.0 | 0/? | Not started | - |
| 11. Video Preview Mode | v2.0 | 0/? | Not started | - |
