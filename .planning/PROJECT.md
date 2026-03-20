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

### Active

- [ ] Intelligent programgenerator baseret på koreografi-principper (styrker mod C, svagheder diskret, musikalsk bue, koefficient-vægtning)
- [ ] Auto-genererede ruter i banen per øvelse (ikke frihåndstegning)
- [ ] Drag-and-drop tilpasning af øvelsesrækkefølge og ruter
- [ ] Real-time regelvalidering (obligatoriske øvelser, mindstefstand, forbudte sekvenser, laterale min. 12m)
- [ ] Google Lyria musik-generering per gangart med BPM/genre/mood
- [ ] Mix-generering: kombiner gangart-numre til ét kür-nummer
- [ ] Persistens: gem alt i localStorage/IndexedDB
- [ ] Loading/progress UI ved generering

### Out of Scope

- ClicknClear-integration — afventer partnerskabsaftale
- Video-generering af kür — separat milestone (stor feature)
- PDF/print-eksport — separat milestone
- 20x40 arena — udskydes
- Brugerkonti/backend — client-only foreløbigt
- Frihåndstegning i arena — erstattes af auto-genererede ruter

## Context

- Eksisterende codebase med 6-trins wizard, steps 1-5 fungerer men programlogikken skal omskrives fundamentalt
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Web Audio API
- Dansk UI gennemgående (lang="da")
- Nuværende programgenerator er for simpel (styrker først, ingen koreografi-principper)
- Nuværende arena er frihåndstegning — skal erstattes med auto-genererede, redigerbare ruter
- Google Lyria RealTime (Gemini API) til musik — gratis, BPM 60-200
- Forretningsmodel: Lyria gratis → Mubert budget → ClicknClear premium

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
*Last updated: 2026-03-21 after fundamental product pivot — intelligent kür-designer*
