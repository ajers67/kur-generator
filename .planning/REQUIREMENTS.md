# Requirements: FreestyleMaker (Intelligent Kür-Designer)

**Defined:** 2026-03-21
**Core Value:** Rytteren får et professionelt kür-forslag med ruter og musik — genereret på sekunder, ikke uger — som de kan tilpasse og gøre til deres eget.

## v1 Requirements

### 1. Intelligent Program Generation

- [x] **PROG-01**: System genererer en øvelsesrækkefølge baseret på koreografi-principper: styrker placeret mod C/diagonaler, svagheder korte og diskrete, musikalsk bue (rolig start → klimaks → afslutning)
- [x] **PROG-02**: Koefficienter indgår i placeringslogikken — høj-koefficient øvelser får bedre placering (mod C, mere plads)
- [ ] **PROG-03**: Temperament påvirker gangartsskift-strategien (rolig hest: gradvis opbygning, energisk: få energi ud tidligt)
- [x] **PROG-04**: Generatoren producerer varierede forslag — kontrolleret randomisering så samme input ikke giver identisk program
- [x] **PROG-05**: Indridning er altid første øvelse, afslutning altid sidst
- [x] **PROG-06**: Symmetri: øvelser der kræver begge hænder fordeles jævnt

### 2. Auto-genererede Arena-ruter

- [ ] **ROUTE-01**: System genererer ruter i 20x60 banen for hver øvelse baseret på øvelsestype (extensions på diagonaler, laterale langs banen, pirouetter ved centerlinjen osv.)
- [ ] **ROUTE-02**: Styrke-øvelser placeres i synlige zoner (mod C-enden, diagonaler) og svagheder i mindre synlige zoner (hjørner, kort side)
- [ ] **ROUTE-03**: Ruter forbindes automatisk med overgangslinjer mellem øvelser
- [ ] **ROUTE-04**: Arena-visning viser alle ruter farvekodet per gangart med øvelses-labels

### 3. Bruger-tilpasning

- [ ] **EDIT-01**: Bruger kan flytte øvelser op/ned i rækkefølgen via drag-and-drop
- [ ] **EDIT-02**: Bruger kan justere/flytte ruter i arena-viewet
- [ ] **EDIT-03**: Bruger kan re-generere hele programmet med ét klik (nyt forslag)
- [ ] **EDIT-04**: Ændringer reflekteres real-time i både program-liste og arena-visning

### 4. Regelvalidering

- [ ] **RULE-01**: System validerer at alle obligatoriske øvelser for niveauet er med i programmet
- [ ] **RULE-02**: System validerer at laterale bevægelser dækker minimum 12 meter
- [ ] **RULE-03**: System advarer hvis øvelser fra højere niveau er inkluderet (forbudt)
- [ ] **RULE-04**: System viser valideringsstatus som tydelige fejl/advarsler i UI'et
- [ ] **RULE-05**: Validering kører real-time ved hver bruger-ændring

### 5. Music Generation

- [ ] **MUS-01**: Bruger kan generere musik per gangart via Google Lyria med BPM tilpasset gangarten (skridt ~60-72, trav ~140-160, galop ~100-120)
- [ ] **MUS-02**: Bruger kan angive genre/mood/stil via tekstprompt per gangart
- [ ] **MUS-03**: Bruger kan forhøre genereret musik direkte i browseren
- [ ] **MUS-04**: Bruger kan re-generere musik for en gangart
- [ ] **MUS-05**: Progress/loading UI mens musik genereres

### 6. Mix Pipeline

- [ ] **MIX-01**: System kombinerer gangart-numre til ét sammenhængende kür-nummer
- [ ] **MIX-02**: Øvelsernes varighed vægtes efter coefficient
- [ ] **MIX-03**: Bruger kan downloade det færdige mix som lydfil

### 7. Persistence

- [x] **PERS-01**: Wizard-state gemmes i localStorage og overlever refresh
- [ ] **PERS-02**: Genereret musik gemmes i IndexedDB og overlever refresh
- [x] **PERS-03**: Arena-ruter og tilpasninger gemmes og overlever refresh
- [x] **PERS-04**: Bruger kan starte forfra (ryd alt gemt state)

### 8. Code Quality (done)

- [x] **QUAL-01**: generateProgramOrder() deduplikeret til src/lib/program-generator.ts
- [x] **QUAL-02**: Dead code fjernet

## v2 Requirements

### Premium Music

- **PREM-01**: ClicknClear-integration (licenseret musik, premium)
- **PREM-02**: Mubert-integration (AI-katalog, budget)
- **PREM-03**: Upload-fallback (egne filer)

### Export

- **EXP-01**: PDF/print-eksport af kür-program med arena-ruter
- **EXP-02**: Video-generering af kür med animation og musik

### Arena

- **ARENA-01**: 20x40 arena-support for LA/LA6/Pony niveauer

## Out of Scope

| Feature | Reason |
|---------|--------|
| Brugerkonti og authentication | Client-only app |
| Backend/database | Al logik i browseren |
| DAW-style audio editing | Brugere er ryttere, ikke producere |
| Frihåndstegning i arena | Erstattet af auto-genererede ruter |
| AI-koreografi (fuld AI) | Vi bruger principper + randomisering, ikke AI |
| Spotify/streaming | Licensproblemer |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01 | Phase 1 | Complete |
| QUAL-02 | Phase 1 | Complete |
| PERS-01 | Phase 2 | Complete |
| PERS-03 | Phase 2 | Complete |
| PERS-04 | Phase 2 | Complete |
| PROG-01 | Phase 3 | Complete |
| PROG-02 | Phase 3 | Complete |
| PROG-03 | Phase 3 | Pending |
| PROG-04 | Phase 3 | Complete |
| PROG-05 | Phase 3 | Complete |
| PROG-06 | Phase 3 | Complete |
| RULE-01 | Phase 4 | Pending |
| RULE-02 | Phase 4 | Pending |
| RULE-03 | Phase 4 | Pending |
| RULE-04 | Phase 4 | Pending |
| RULE-05 | Phase 4 | Pending |
| ROUTE-01 | Phase 5 | Pending |
| ROUTE-02 | Phase 5 | Pending |
| ROUTE-03 | Phase 5 | Pending |
| ROUTE-04 | Phase 5 | Pending |
| EDIT-01 | Phase 6 | Pending |
| EDIT-02 | Phase 6 | Pending |
| EDIT-03 | Phase 6 | Pending |
| EDIT-04 | Phase 6 | Pending |
| MUS-01 | Phase 7 | Pending |
| MUS-02 | Phase 7 | Pending |
| MUS-03 | Phase 7 | Pending |
| MUS-04 | Phase 7 | Pending |
| MUS-05 | Phase 7 | Pending |
| MIX-01 | Phase 8 | Pending |
| MIX-02 | Phase 8 | Pending |
| MIX-03 | Phase 8 | Pending |
| PERS-02 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 31 total (2 complete, 29 pending)
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after product pivot to intelligent kür-designer*
