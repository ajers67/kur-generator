# Roadmap: FreestyleMaker (Intelligent Kur-Designer)

## Overview

FreestyleMaker pivoterer fra et simpelt planlaegningsvaerktoj til en intelligent kur-designer. Systemet genererer komplette freestyle-programmer med ruter og musik baseret pa koreografi-principper og hestens styrker/svagheder. Brugeren kan tilpasse alt, og systemet validerer reglerne lobende.

Koreografi-principper er dokumenteret i `.planning/CHOREOGRAPHY-RULES.md` -- den autoritative kilde for programgenerering.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Code Cleanup** - Deduplicate program generation and remove dead code
- [x] **Phase 2: Wizard Persistence** - Save wizard state so work survives page refresh (completed 2026-03-21)
- [x] **Phase 3: Intelligent Program Generator** - Rebuild program ordering based on choreography principles
- [x] **Phase 4: Rule Validation Engine** - Real-time validation of FEI/DRF rules
- [ ] **Phase 5: Auto-generated Arena Routes** - Generate visual routes in the arena for each exercise
- [ ] **Phase 6: User Customization** - Drag-and-drop editing of program order and routes
- [ ] **Phase 7: Lyria Music Generation** - Generate per-gait music via Google Lyria API
- [ ] **Phase 8: Mix Pipeline & Music Persistence** - Combine gait tracks and persist all data

## Phase Details

### Phase 1: Code Cleanup
**Goal**: Codebase has a single source of truth for program generation and no dead code
**Status**: Complete ✓ (2026-03-20)
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
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Install zustand, create types, stores, and persistence helpers
- [x] 02-02-PLAN.md — Create project selector UI and refactor page.tsx to use stores
- [x] 02-03-PLAN.md — Install vitest and write persistence tests

### Phase 3: Intelligent Program Generator
**Goal**: System generates exercise ordering based on real choreography principles from CHOREOGRAPHY-RULES.md
**Depends on**: Phase 2
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06
**Canonical refs**: `.planning/CHOREOGRAPHY-RULES.md`
**Success Criteria**:
  1. Generated program places strength-rated exercises in prominent positions (toward C, diagonals)
  2. Weakness-rated exercises are placed in less visible positions (corners, short sides)
  3. High-coefficient exercises get better placement than low-coefficient
  4. Program follows musical arc (calm start -> build -> climax -> finish)
  5. Same input produces varied results across multiple generations
  6. Entry always first, halt/salute always last, symmetry maintained
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — TDD: Build intelligent program generator with arc structure, placement, symmetry, and randomization
- [x] 03-02-PLAN.md — Add temperament gait-ordering tests for PROG-03 coverage

### Phase 4: Rule Validation Engine
**Goal**: System validates FEI/DRF rules in real-time and shows clear errors/warnings
**Depends on**: Phase 3
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05
**Canonical refs**: `.planning/CHOREOGRAPHY-RULES.md` §7
**Success Criteria**:
  1. Missing obligatory exercises flagged with specific error messages
  2. Lateral movements under 12m flagged
  3. Higher-level exercises flagged as forbidden
  4. Validation runs on every program change without perceptible delay
  5. Errors/warnings displayed clearly in UI (red/yellow badges)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — TDD: Build pure validateProgram function with tests for all FEI/DRF rules
- [x] 04-02-PLAN.md — Create ValidationBanner component and integrate into ProgramPreview

### Phase 5: Auto-generated Arena Routes
**Goal**: System generates visual routes in the 20x60 arena for each exercise, connected with transitions
**Depends on**: Phase 4
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04
**Canonical refs**: `.planning/CHOREOGRAPHY-RULES.md` §2, §6
**Success Criteria**:
  1. Each exercise has auto-generated route appropriate for its type (extensions on diagonals, laterals along track)
  2. Strength exercises route toward C-end, weakness exercises in less visible zones
  3. Routes connected with transition lines between exercises
  4. Arena view shows all routes color-coded by gait with exercise labels
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — TDD: Build generateRoutes pure function with exercise type classification and route templates
- [ ] 05-02-PLAN.md — Create ArenaRouteView component and integrate into arena step

### Phase 6: User Customization
**Goal**: Riders can customize the generated program to make it their own while staying within rules
**Depends on**: Phase 5
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria**:
  1. User can drag exercises to reorder in program list
  2. User can adjust/move routes in arena view
  3. User can regenerate entire program with one click
  4. All changes update both program list and arena view in real-time
  5. Rule validation runs after every edit
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — [To be planned]
- [ ] 06-02-PLAN.md — [To be planned]

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
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — [To be planned]
- [ ] 07-02-PLAN.md — [To be planned]

### Phase 8: Mix Pipeline & Music Persistence
**Goal**: Combine gait tracks into one downloadable kur file, persist everything
**Depends on**: Phase 7
**Requirements**: MIX-01, MIX-02, MIX-03, PERS-02
**Success Criteria**:
  1. All gait tracks combined into one audio file with coefficient-weighted durations
  2. Downloadable audio file output
  3. Generated music persists in IndexedDB across sessions
  4. "Start forfra" clears music cache too
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md — [To be planned]
- [ ] 08-02-PLAN.md — [To be planned]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Code Cleanup | 2/2 | Complete | 2026-03-20 |
| 2. Wizard Persistence | 3/3 | Complete   | 2026-03-21 |
| 3. Intelligent Program Generator | 2/2 | Complete | 2026-03-22 |
| 4. Rule Validation Engine | 2/2 | Complete | 2026-03-22 |
| 5. Auto-generated Arena Routes | 0/2 | Not started | - |
| 6. User Customization | 0/? | Not started | - |
| 7. Lyria Music Generation | 0/? | Not started | - |
| 8. Mix Pipeline & Music Persistence | 0/? | Not started | - |
