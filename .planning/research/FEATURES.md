# Feature Research

**Domain:** Dressage freestyle (kur) music planning and generation
**Researched:** 2026-03-20
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| BPM-aware music search per gait | The entire point of kur music is matching tempo to the horse's footfall. Walk ~48-66 BPM, trot ~72-90, canter ~88-115. Every serious rider knows their horse's BPM. | MEDIUM | Mubert API supports BPM filtering. Must map Danish gait names to BPM ranges. Existing `bpmMatchesGait` in `bpm-detect.ts` already has the ranges. |
| Music assignment per gait | Judges score music suitability per gait (coefficient 4). One track per gait minimum. | LOW | Already exists in upload flow (gait selector per track). Replicate for Mubert results. |
| Audio preview/playback before committing | Riders must hear the music to judge if it suits the horse's character. Blind selection is useless. | LOW | Mubert provides preview URLs. Use `<audio>` element. Already partially implemented for mixed output. |
| Crossfade transitions between gaits | Abrupt cuts lose points on "Musik" artistic score. Smooth transitions are non-negotiable for any kur. | MEDIUM | Already implemented in `audio-mixer.ts` with 2-second crossfades. Needs to work with Mubert tracks too, not just uploaded files. |
| Mix timeline visualization | Rider needs to see which music plays when, aligned with their program exercises. | LOW | Already implemented as colored bar segments in `MusicManager.tsx`. Good enough for MVP. |
| Download final mix as audio file | Riders practice at home with the mix playing on speakers. Need a portable file. | LOW | Already implemented (WAV download). Consider adding MP3 export later for smaller files. |
| Gait coverage indicator | Rider must see at-a-glance which gaits still need music. Incomplete = can't generate mix. | LOW | Already implemented (colored badges with check/mangler status). |
| Upload own music (fallback) | Many riders already own licensed music or have specific tracks in mind. Removing upload kills existing workflow. | LOW | Already implemented. Must coexist alongside Mubert search. |
| Music rights disclaimer | FEI and national federations (including DRF) require music licensing for competition. ClicknClear is the standard. Users must know their responsibilities. | LOW | Already implemented as footer text linking to ClicknClear. |
| Session persistence (localStorage) | Kur planning takes hours across multiple sessions. Losing work on refresh is a dealbreaker. | MEDIUM | Not yet implemented. Listed in PROJECT.md Active requirements. Critical for any music workflow -- generating/searching tracks is time-consuming. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI music generation by mood/genre (Mubert) | Competitors (Equimusic, professional services) only help you find existing songs. Generating custom royalty-free music at exact BPM is genuinely new for this market. mykuer.now is the only direct competitor attempting this, still in closed beta. | MEDIUM | Mubert API call with BPM + genre + mood parameters. Free tier: 25 tracks, 30 min/day generation. Design UI to minimize wasted generations. |
| Mood/character matching to horse profile | Existing `musicPreference` field captures horse temperament but is currently unused. Mapping horse character (energetic, calm, elegant) to Mubert mood tags creates an intelligent default. | LOW | Map horse temperament values to Mubert mood strings. Low effort, high perceived value. |
| Integrated end-to-end workflow | No existing tool combines level selection, program ordering, arena drawing, AND music in one flow. Professional services charge EUR 200-500+ for choreography+music. DIY riders use 3-4 separate tools (BPM counter app, Equimusic database, Audacity, arena template). | Already exists (wizard structure) | This is the product's core differentiator. The music milestone extends it to the most painful step. |
| Smart BPM suggestion based on gait | When searching for music, auto-fill the BPM range based on the selected gait. Saves the rider from having to remember ranges. | LOW | Already have BPM ranges in `bpmMatchesGait`. Use as default search parameters for Mubert queries. |
| Generation budget awareness | Show remaining Mubert generations (25/day free tier) so users don't waste them. Guide users toward previewing before generating. | LOW | Track generation count in localStorage. Show "X generations remaining today" in UI. Unique to this app since no competitor uses Mubert. |
| Exercise-weighted timeline | Current mixer gives equal time to all exercises. Weighting by coefficient (passage x2 gets more time) creates more realistic mixes matching actual competition pacing. | MEDIUM | Modify `generateMixTimeline` to use exercise coefficients from `kur-levels.ts`. Each exercise already has a `coefficient` field. |
| Tempo/BPM adjustment per track | Allow slight BPM shift (+/- 5%) to better match the horse, using Web Audio API playbackRate. | MEDIUM | `source.playbackRate.value = targetBPM / trackBPM`. Must preserve audio quality. Small adjustments (<5%) sound fine. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full DAW-style audio editor | Power users want precise cut points, volume curves, multi-track editing | Massively complex to build, already solved by Audacity/GarageBand which are free. Scope explosion guaranteed. Users who need this level of control are better served by exporting the timeline and finishing in a real DAW. | Provide "Export to Audacity project" or detailed timestamp list instead. Keep the auto-mix simple. |
| Real-time streaming music during arena drawing | "Play music while I draw the route so I can time it" | Synchronizing drawn paths to audio timeline is extremely complex UX. Arena drawing is a spatial planning tool, not a real-time performance tool. Mixing concerns breaks both features. | Keep arena drawing (step 5) and music (step 6) as separate steps. Provide time estimates per exercise segment so rider can plan. |
| Spotify/Apple Music integration | "I already have playlists of music I like" | Streaming services do not allow downloading, remixing, or competition use. Licensing is impossible. Creates false sense of having valid competition music. | Keep upload for owned files, Mubert for generated, ClicknClear (future) for licensed commercial tracks. |
| AI choreography from music | "Analyze the music and suggest which exercises go where" | Inverts the correct workflow. Choreography should be driven by the horse's strengths and level requirements, not by music structure. Music follows choreography, not the other way around. | Current flow is correct: profile -> program -> arena -> music. Keep this order. |
| Automatic BPM detection of the horse from video | "Film my horse and detect BPM automatically" | Computer vision for stride detection is unreliable, requires significant ML infrastructure, and adds massive complexity for a niche use case. | Provide clear instructions for manual BPM counting (metronome app while riding). Link to Sandra Beaulieu's guide. |
| Multi-track layering per gait | "I want drums + melody + ambient layered" | Mubert already generates complete tracks. Layering is a DAW feature. Complexity explosion for minimal benefit in a kur context where one cohesive track per gait is standard. | Single track per gait from Mubert. Users wanting layered compositions should use a professional service. |

## Feature Dependencies

```
[Session persistence (localStorage)]
    └──required by──> [Mubert search/generate]
                          └──required by──> [Generation budget awareness]

[BPM-aware music search]
    └──required by──> [Smart BPM suggestion based on gait]

[Mubert API integration]
    └──required by──> [Mood/character matching to horse profile]
    └──required by──> [Audio preview of Mubert tracks]
    └──required by──> [Generation budget awareness]

[Upload own music (existing)] ──coexists with──> [Mubert search/generate]
    └──both feed into──> [Gait assignment]
                             └──required by──> [Mix generation]
                                                   └──required by──> [Timeline visualization]
                                                   └──required by──> [Download final mix]

[Exercise-weighted timeline] ──enhances──> [Mix generation]
    └──uses──> [Exercise coefficients from kur-levels.ts]
```

### Dependency Notes

- **Session persistence must come first:** Mubert has daily generation limits. If the user generates tracks, refreshes the page, and loses everything, they have wasted irreplaceable daily quota. Persistence is a prerequisite, not a nice-to-have.
- **Mubert integration is the core new work:** Everything else (mood matching, budget awareness, smart BPM defaults) builds on top of a working Mubert search/generate flow.
- **Upload and Mubert coexist:** The gait assignment and mix pipeline must accept tracks from either source. The `MixTrack` interface already abstracts over the source -- it just needs an `AudioBuffer` and assigned gait.
- **Exercise-weighted timeline is independent:** Can be added any time without affecting other features. Only modifies `generateMixTimeline`.

## MVP Definition

### Launch With (v1 -- this milestone)

- [x] BPM-aware Mubert search per gait -- core replacement for upload-only workflow
- [x] Audio preview of Mubert results before selecting -- critical for informed decisions
- [x] Gait assignment for Mubert tracks -- reuse existing pattern from upload flow
- [x] Mix generation with Mubert tracks -- extend existing `renderMix` pipeline
- [x] Upload fallback preserved -- don't break existing users
- [x] Session persistence (localStorage) -- prerequisite for any serious use with Mubert's limited quota
- [x] Generation budget indicator -- prevent frustrating quota exhaustion

### Add After Validation (v1.x)

- [ ] Mood/character matching from horse profile -- once Mubert integration is stable and we know which mood tags work well for dressage
- [ ] Smart BPM auto-fill from gait selection -- quick UX win after core search works
- [ ] Exercise-weighted timeline -- after users report that equal-time segments feel wrong
- [ ] Tempo adjustment (+/- 5% playbackRate) -- after users need fine-tuning
- [ ] MP3 export option -- after users complain about WAV file sizes

### Future Consideration (v2+ / later milestones)

- [ ] ClicknClear integration -- premium licensed commercial music, awaiting partnership
- [ ] PDF/print export with music timeline -- combined output of arena + program + music
- [ ] Collaborative sharing (share kur plan with trainer) -- requires backend/accounts

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Session persistence (localStorage) | HIGH | MEDIUM | P1 |
| Mubert search by BPM/genre/mood | HIGH | MEDIUM | P1 |
| Audio preview of search results | HIGH | LOW | P1 |
| Gait assignment for Mubert tracks | HIGH | LOW | P1 |
| Mix generation with Mubert tracks | HIGH | LOW | P1 |
| Generation budget indicator | MEDIUM | LOW | P1 |
| Upload fallback preserved | HIGH | LOW (already exists) | P1 |
| Smart BPM auto-fill from gait | MEDIUM | LOW | P2 |
| Mood matching from horse profile | MEDIUM | LOW | P2 |
| Exercise-weighted timeline | MEDIUM | MEDIUM | P2 |
| Tempo adjustment (playbackRate) | LOW | MEDIUM | P3 |
| MP3 export | LOW | MEDIUM | P3 |
| ClicknClear integration | HIGH | HIGH | P3 (deferred) |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible within milestone
- P3: Nice to have, future milestone

## Competitor Feature Analysis

| Feature | Equimusic (free DB) | mykuer.now (beta) | Professional services | DIY (Audacity) | Our Approach |
|---------|--------------------|--------------------|----------------------|-----------------|--------------|
| BPM search | Yes (existing songs) | AI-generated | Manual matching | Manual | Mubert API with auto BPM ranges per gait |
| Music generation | No | Yes (AI) | Custom composition | No | Mubert AI generation with BPM/mood control |
| Gait assignment | No | Automatic | Manual | Manual | User picks per gait, smart defaults |
| Transitions/crossfade | No | Automatic | Professional edit | Manual in Audacity | Auto 2s crossfade, exercise-aligned |
| Program integration | No | Described but unclear | Yes (choreographer) | No | Full wizard: level -> exercises -> arena -> music |
| Licensing | Links to purchase | Unclear | Handled by service | User responsibility | Disclaimer + future ClicknClear |
| Price | Free | EUR 20 beta | EUR 200-500+ | Free (time cost) | Free (Mubert free tier) |
| Timeline visualization | No | Unclear | PDF timeline | No | Colored segment bar with exercise names |
| Arena drawing | No | No | Sometimes | No | Yes -- integrated step 5 |

**Key competitive insight:** The market is split between free-but-manual tools (Equimusic + Audacity) and expensive professional services. mykuer.now is the only direct AI competitor but is in early beta. Our advantage is the integrated end-to-end workflow from level selection through music generation. No competitor combines all steps.

## Sources

- [Equimusic](http://www.equimusic.com/) -- free BPM-indexed music database for freestyle
- [mykuer.now](https://www.mykuer.now/) -- AI kur music platform, closed beta, EUR 20
- [Mubert API](https://mubert.com/api) -- AI music generation with BPM/genre/mood control
- [ClicknClear](https://www.clicknclear.com/sporteducation/dressage) -- official music licensing for dressage (FEI/USEF/IOC partner)
- [Sandra Beaulieu - BPM Guide](https://www.thecreativeequestrian.com/wordpress/freestylebpm) -- how to determine horse BPM
- [Sandra Beaulieu - Software Guide](https://www.thecreativeequestrian.com/wordpress/freestylesoftware) -- freestyle music editing tools
- [Practical Horseman - Music Selection](https://practicalhorseman.com/training/how-to-select-music-for-a-dressage-freestyle/) -- BPM ranges per gait
- [Horse Sport - Freestyle Scores](https://horsesport.com/magazine/training/understanding-improving-freestyle-dressage-scores/) -- judging criteria for music interpretation
- [Mad Barn - Freestyle Guide](https://madbarn.com/musical-dressage-freestyle/) -- competition format and scoring
- [USEF Music Clearance](https://www.usef.org/compete/disciplines/dressage/music-clearance-requirements) -- licensing requirements

---
*Feature research for: Dressage kur music integration milestone*
*Researched: 2026-03-20*
