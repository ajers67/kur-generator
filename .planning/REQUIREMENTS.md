# Requirements: FreestyleMaker (Intelligent Kur-Designer)

**Defined:** 2026-03-21, updated 2026-03-23
**Core Value:** Rytteren far et professionelt kur-forslag med ruter og musik — genereret pa sekunder, ikke uger — som de kan tilpasse og gore til deres eget.

## v1 Requirements (completed 2026-03-23)

### 1. Intelligent Program Generation
- [x] **PROG-01** through **PROG-06**: Complete (Phase 3)

### 2. Auto-genererede Arena-ruter
- [x] **ROUTE-01** through **ROUTE-04**: Complete (Phase 5)

### 3. Bruger-tilpasning
- [x] **EDIT-01**, **EDIT-02**, **EDIT-04**: Complete (Phase 6)
- [x] ~~**EDIT-03**~~: Removed (forretningsmodel: et program per kob)

### 4. Regelvalidering
- [x] **RULE-01** through **RULE-05**: Complete (Phase 4)

### 5. Music Generation
- [x] **MUS-01** through **MUS-05**: Complete (Phase 7)

### 6. Mix Pipeline
- [x] **MIX-01** through **MIX-03**: Complete (Phase 8)

### 7. Persistence
- [x] **PERS-01** through **PERS-04**: Complete (Phase 2, 8)

### 8. Code Quality
- [x] **QUAL-01**, **QUAL-02**: Complete (Phase 1)

## v2 Requirements (Arena Animation & Video Preview)

### 9. Animation

- [x] **ANIM-01**: Top-down arena animation med hest+rytter marker der folger ruterne
- [x] **ANIM-02**: Markoren bevager sig med korrekt hastighed per ovelse (langsommere skridt, hurtigere galop)
- [ ] **ANIM-03**: Animation synkroniseret med genereret musik (gangartsskift = musikkskift)
- [x] **ANIM-04**: Gangarts-farve pa markoren matcher GAIT_COLORS

### 10. Playback

- [ ] **PLAY-01**: Play/pause knap starter/stopper animation + musik samtidig
- [ ] **PLAY-02**: Seek/slider til at springe til et punkt i programmet
- [ ] **PLAY-03**: Hastigheds-kontrol (0.5x, 1x, 1.5x, 2x)
- [ ] **PLAY-04**: Aktuel ovelse highlightes i programlisten under afspilning

### 11. Video Preview

- [ ] **VID-01**: Fuld-skarm preview mode med arena animation + musik
- [ ] **VID-02**: Tidslinje der viser ovelses-segmenter med farver og labels
- [ ] **VID-03**: "Afspil kur" knap tilgangelig fra program-preview step

## v3 Requirements (fremtidige)

### AI Video
- **AIVID-01**: Realistisk AI-genereret video af hest+rytter (LoRA fine-tuning)

### Export
- **EXP-01**: PDF/print-eksport af program + arena-ruter
- **EXP-02**: Video-eksport (MP4/WebM) af arena-animation

### Partnerskab
- **PREM-01**: ClicknClear licenseret musik-integration

### Arena
- **ARENA-01**: 20x40 arena-support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Brugerkonti og authentication | Client-only app forelobig |
| Backend/database | Al logik i browseren |
| 3D hest-animation | For komplekst, top-down er tilstrakkeligt for v2 |
| AI realistisk video | Kraver LoRA fine-tuning + traningsdata — v3 |
| 20x40 arena | Udskydes |

## Traceability

### v1.0 (shipped 2026-03-23)

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01, QUAL-02 | Phase 1 | Complete |
| PERS-01, PERS-03, PERS-04 | Phase 2 | Complete |
| PROG-01 to PROG-06 | Phase 3 | Complete |
| RULE-01 to RULE-05 | Phase 4 | Complete |
| ROUTE-01 to ROUTE-04 | Phase 5 | Complete |
| EDIT-01, EDIT-02, EDIT-04 | Phase 6 | Complete |
| MUS-01 to MUS-05 | Phase 7 | Complete |
| MIX-01 to MIX-03, PERS-02 | Phase 8 | Complete |

### v2.0 (Arena Animation & Video Preview)

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANIM-01 | Phase 9 | Complete |
| ANIM-02 | Phase 9 | Complete |
| ANIM-04 | Phase 9 | Complete |
| ANIM-03 | Phase 10 | Pending |
| PLAY-01 | Phase 10 | Pending |
| PLAY-02 | Phase 10 | Pending |
| PLAY-03 | Phase 10 | Pending |
| PLAY-04 | Phase 10 | Pending |
| VID-01 | Phase 11 | Pending |
| VID-02 | Phase 11 | Pending |
| VID-03 | Phase 11 | Pending |

**Coverage:**
- v2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-23 after v1.0 complete, v2.0 roadmap created*
