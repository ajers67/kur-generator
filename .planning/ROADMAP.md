# Roadmap: FreestyleMaker (Freestyle Music Milestone)

## Overview

This milestone transforms the FreestyleMaker from a program-planning tool into a complete freestyle workflow with AI-generated music. We start by cleaning up the existing codebase (deduplicate, remove dead code), then add localStorage persistence so wizard progress survives refresh, then integrate Google Lyria for per-gait music generation, persist generated audio in IndexedDB so tracks are not lost, and finally build the mix pipeline that combines gait tracks into one downloadable kur file.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Code Cleanup** - Deduplicate program generation and remove dead code to establish clean foundation
- [ ] **Phase 2: Wizard Persistence** - Save wizard state in localStorage so work survives page refresh
- [ ] **Phase 3: Lyria Music Generation** - Generate music per gait via Google Lyria with BPM, genre and mood control
- [ ] **Phase 4: Music Persistence** - Store generated audio in IndexedDB so tracks survive refresh without re-generation
- [ ] **Phase 5: Mix Pipeline** - Combine per-gait tracks into one downloadable kur audio file

## Phase Details

### Phase 1: Code Cleanup
**Goal**: Codebase has a single source of truth for program generation and no dead code weighing down comprehension
**Depends on**: Nothing (first phase)
**Requirements**: QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. Program generation logic exists in exactly one location (src/lib/program-generator.ts) and all call sites use it
  2. ArenaPreview stub, unused HorseProfile type, unused musicPreference field, and unused trackIndex are gone from the codebase
  3. Existing wizard steps 1-5 still function identically after cleanup (no regressions)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Extract generateProgramOrder to shared module in src/lib/program-generator.ts
- [ ] 01-02-PLAN.md — Remove dead code: ArenaPreview, HorseProfile, musicPreference, trackIndex

### Phase 2: Wizard Persistence
**Goal**: Riders can close the browser or refresh at any point and resume exactly where they left off
**Depends on**: Phase 1
**Requirements**: PERS-01, PERS-03, PERS-04
**Success Criteria** (what must be TRUE):
  1. User fills in wizard through step 4, refreshes the page, and all data (level, horse profile, ratings, program order) is restored
  2. User draws arena routes in step 5, refreshes the page, and drawings are restored
  3. User clicks an explicit "Start forfra" action and all saved state is cleared, returning to step 1
  4. First load with no saved state works identically to current behavior (no hydration errors or stale data)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Lyria Music Generation
**Goal**: Riders can generate custom music for each gait with correct BPM, preview it, and iterate until satisfied
**Depends on**: Phase 2
**Requirements**: MUS-01, MUS-02, MUS-03, MUS-04, MUS-05, QUAL-03
**Success Criteria** (what must be TRUE):
  1. User selects a gait and generates music via Lyria with BPM automatically set to the correct range (walk 60-72, trot 140-160, canter 100-120)
  2. User can type a genre/mood/style prompt (e.g. "klassisk", "dramatisk") and the generated music reflects the request
  3. User can play back generated music in the browser before committing to it
  4. User can re-generate music for any gait if the result does not fit, getting a new track
  5. User sees an animated progress indicator while music is being generated (not a frozen UI)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Music Persistence
**Goal**: Generated music tracks are cached locally so riders never lose tracks to a page refresh
**Depends on**: Phase 3
**Requirements**: PERS-02
**Success Criteria** (what must be TRUE):
  1. User generates music for walk and trot, refreshes the page, and both tracks are still available for playback without re-generation
  2. Cached audio persists across browser sessions (survives tab close and reopen)
  3. When user clicks "Start forfra", cached audio is also cleared along with wizard state
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Mix Pipeline
**Goal**: Riders can combine their per-gait tracks into one complete kur audio file and download it
**Depends on**: Phase 4
**Requirements**: MIX-01, MIX-02, MIX-03
**Success Criteria** (what must be TRUE):
  1. User with generated tracks for all gaits can trigger mix generation and gets a single combined audio file
  2. Each gait segment in the mix has duration weighted by exercise coefficient (higher coefficient = longer segment), not equal splits
  3. User can download the finished mix as an audio file to their computer
  4. Mix generation shows progress while rendering (not frozen UI)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Code Cleanup | 1/2 | In Progress|  |
| 2. Wizard Persistence | 0/2 | Not started | - |
| 3. Lyria Music Generation | 0/3 | Not started | - |
| 4. Music Persistence | 0/1 | Not started | - |
| 5. Mix Pipeline | 0/2 | Not started | - |
