# Requirements: Kur Generator (Freestyle Music Milestone)

**Defined:** 2026-03-20
**Core Value:** Rytteren kan gå fra valgt niveau til et komplet kür-program med tilpasset musik — alt i én samlet arbejdsgang.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Music Generation

- [ ] **MUS-01**: Bruger kan generere musik per gangart via Google Lyria med BPM tilpasset gangarten (skridt ~60-72, trav ~140-160, galop ~100-120)
- [ ] **MUS-02**: Bruger kan angive genre/mood/stil via tekstprompt for hver gangart (f.eks. "klassisk", "moderne", "dramatisk")
- [ ] **MUS-03**: Bruger kan forhøre genereret musik direkte i browseren før den bruges
- [ ] **MUS-04**: Bruger kan re-generere musik for en gangart hvis resultatet ikke passer
- [ ] **MUS-05**: Bruger ser progress/loading UI med animation mens musik genereres

### Music Mix

- [ ] **MIX-01**: System kombinerer gangart-numre til ét sammenhængende kür-nummer med korrekt varighed per øvelse
- [ ] **MIX-02**: Bruger kan downloade det færdige mix som lydfil
- [ ] **MIX-03**: Øvelsernes varighed i mixet vægtes efter coefficient (ikke lige fordeling)

### Persistence

- [ ] **PERS-01**: Wizard-state (niveau, profil, ratings, programrækkefølge) gemmes i localStorage og overlever refresh
- [ ] **PERS-02**: Genereret musik gemmes i IndexedDB og overlever refresh (undgå re-generering)
- [ ] **PERS-03**: Arena-tegninger gemmes i localStorage og overlever refresh
- [ ] **PERS-04**: Bruger kan starte forfra (ryd gemt state) med en eksplicit handling

### Code Quality

- [ ] **QUAL-01**: generateProgramOrder() er deduplikeret til én funktion i src/lib/program-generator.ts
- [ ] **QUAL-02**: Dead code fjernet: ArenaPreview stub, ubrugt HorseProfile type, ubrugt musicPreference, ubrugt trackIndex
- [ ] **QUAL-03**: Loading/progress UI-komponent til brug ved musikgenerering og mix-rendering

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Premium Music Sources

- **PREM-01**: ClicknClear-integration: søg og vælg licenseret musik fra kendte kunstnere
- **PREM-02**: Mubert-integration: AI-genereret katalog-musik som budget-alternativ
- **PREM-03**: Upload-fallback: bruger kan uploade egne lydfiler

### Export

- **EXP-01**: PDF/print-eksport af kür-program
- **EXP-02**: Video-generering af kür med musik og arena-animation

### Arena

- **ARENA-01**: 20x40 arena-support for LA/LA6/Pony niveauer
- **ARENA-02**: Arena-preview som read-only visning af tegnede ruter

## Out of Scope

| Feature | Reason |
|---------|--------|
| Brugerkonti og authentication | Client-only app, ingen backend |
| Backend/database | Al logik kører i browseren |
| DAW-style audio editing | Scope trap — brugere er ryttere, ikke musikproducere |
| Spotify/streaming integration | Licensproblemer, ikke relevant for konkurrencebrug |
| AI-koreografi | For komplekst, kræver domæneforskning |
| Video BPM-detektion | Niche-feature, lav prioritet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01 | Phase 1 | Pending |
| QUAL-02 | Phase 1 | Pending |
| PERS-01 | Phase 2 | Pending |
| PERS-03 | Phase 2 | Pending |
| PERS-04 | Phase 2 | Pending |
| MUS-01 | Phase 3 | Pending |
| MUS-02 | Phase 3 | Pending |
| MUS-03 | Phase 3 | Pending |
| MUS-04 | Phase 3 | Pending |
| MUS-05 | Phase 3 | Pending |
| QUAL-03 | Phase 3 | Pending |
| PERS-02 | Phase 4 | Pending |
| MIX-01 | Phase 5 | Pending |
| MIX-02 | Phase 5 | Pending |
| MIX-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
