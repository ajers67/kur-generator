# FreestyleMaker

## What This Is

En intelligent kür-designer til dressurryttere. Systemet genererer et komplet freestyle-program — rækkefølge, ruter i banen og musik — baseret på hestens styrker/svagheder og anerkendte koreografi-principper. Rytteren kan tilpasse forslaget, og systemet validerer løbende at reglerne overholdes. Målgruppen er danske dressurryttere på alle niveauer.

## Core Value

Rytteren får et professionelt kür-forslag med ruter og musik — genereret på sekunder, ikke uger — som de kan tilpasse og gøre til deres eget.

## Requirements

### Validated

- Niveauvælger med danske dressurniveauer (LA, LA6, MB, MA, GP m.fl.) — existing
- Hesteprofil med navn og temperament — existing
- Øvelsesrating per gangart med styrke-vurdering — existing
- Visuel arena med 20x60 bane og bogstavmarkører — existing
- Deduplikeret programgenerering (én funktion i src/lib/program-generator.ts) — Phase 1
- Dead code fjernet — Phase 1

### Validated (v1.0 — completed 2026-03-23)

- Intelligent programgenerator med koreografi-principper — Phase 3
- Auto-genererede arena-ruter per øvelsestype — Phase 5
- Drag-and-drop tilpasning af øvelser og ruter — Phase 6
- Real-time regelvalidering (FEI/DRF) — Phase 4
- Suno/Lyria musik-generering per gangart med vokal — Phase 7
- Mix-pipeline: kombiner gangart-tracks til WAV download — Phase 8
- IndexedDB musik-persistence — Phase 8
- Wizard-persistence (zustand + localStorage) — Phase 2
- Forretningsmodel: ét program per køb, ingen gratis regenerering — Phase 6

### Active (v2.0 — Arena Animation & Video Preview)

- [ ] Top-down arena animation med hest+rytter ikon der følger ruterne
- [ ] Synkronisering med genereret musik (gangartsskift = musikkskift)
- [ ] Afspilbar video-preview i browseren
- [ ] Playback-kontroller (play/pause, seek, hastighed)

### Out of Scope

- ClicknClear-integration — afventer partnerskabsaftale
- AI-genereret realistisk video (LoRA fine-tuning) — v3, kræver træningsdata + GPU
- PDF/print-eksport — separat milestone
- 20x40 arena — udskydes
- Brugerkonti/backend — client-only foreløbigt

## Context

- Eksisterende codebase med 6-trins wizard, steps 1-5 fungerer men programlogikken skal omskrives fundamentalt
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Web Audio API
- Dansk UI gennemgående (lang="da")
- Nuværende programgenerator er for simpel (styrker først, ingen koreografi-principper)
- Nuværende arena er frihåndstegning — skal erstattes med auto-genererede, redigerbare ruter
- Google Lyria RealTime (Gemini API) til musik — gratis, BPM 60-200
- Forretningsmodel: ét program per køb, ingen gratis regenerering
- Musik-strategi: ClicknClear (partnerskab) → Suno (AI vokal, standard) → Lyria (instrumental fallback)

### Koreografi-principper (fra research)

1. **Styrker fremhæves via placering** — rides mod dommeren (C), på diagonaler, med plads
2. **Svagheder camoufleres** — korte, diskrete, i hjørner/langs banen
3. **Første og sidste indtryk** — indridning sætter stemningen, sværere øvelser mod slutningen
4. **Musikalsk bue** — rolig start → opbygning → klimaks → afslutning
5. **Koefficienter** — koreografi har koeff. 4 (højest!), harmoni 3, sværhedsgrad 2
6. **Symmetri** — øvelser vises på begge hænder
7. **Pauser** — indbyg skridt-pauser til genopretning
8. **Variation** — undgå at generere identiske programmer for samme input

### FEI-regler

- Alle obligatoriske øvelser for niveauet SKAL med
- Laterale bevægelser minimum 12 meter
- Øvelser fra højere niveau er forbudt
- Kombinationer skal udføres tæt (inden for få meter)

## Constraints

- **API**: Google Lyria er gratis men eksperimentel — MusicProvider-abstraktion
- **Client-side**: Al logik kører i browseren
- **Regelmotor**: Validering skal køre real-time mens brugeren tilpasser
- **Variation**: Generatoren må ikke producere identisk program for samme input — indbyg kontrolleret randomisering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auto-genererede ruter erstatter frihåndstegning | Brugeren er rytter, ikke designer — vi genererer, de tilpasser | -- Pending |
| Koreografi-principper driver programlogikken | Research viser at placering i banen og musikalsk bue er vigtigere end simpel rækkefølge | -- Pending |
| Real-time regelvalidering | Brugeren skal frit kunne tilpasse men aldrig ende med et ugyldigt program | -- Pending |
| Google Lyria som musik-kilde | Gratis, BPM-kontrol, genre via prompts | -- Pending |
| Drag-and-drop tilpasning | Brugeren ejer programmet — vi foreslår, de beslutter | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
## Current Milestone: v2.0 Arena Animation & Video Preview

**Goal:** Rytteren kan se en animeret preview af sit kür-program — hest+rytter ikon der følger ruterne i banen, synkroniseret med musikken.

**Target features:**
- Top-down arena animation med bevægelig hest-markør
- Musik-synkronisering (rigtig gangart-musik under afspilning)
- Browser-baseret afspiller med playback-kontroller

---
*Last updated: 2026-03-23 after v1.0 milestone complete — starting v2.0 animation*
