# Kur Generator

## What This Is

Et webbaseret planlægningsværktøj til dressur-freestyle (kür). Rytteren vælger konkurrenceniveau, beskriver hestens profil og styrker, får genereret en programrækkefølge, tegner ruter i ridebanen, og sammensætter musik tilpasset küren. Målgruppen er danske dressurryttere der forbereder freestyle-programmer.

## Core Value

Rytteren kan gå fra valgt niveau til et komplet kür-program med tilpasset musik — alt i én samlet arbejdsgang.

## Requirements

### Validated

- Niveauvælger med danske dressurniveauer (LA, LA6, MB, MA, GP m.fl.) — existing
- Hesteprofil med navn, temperament og musikpræference — existing
- Øvelsesrating per gangart med styrke-vurdering — existing
- Automatisk programrækkefølge baseret på niveau, ratings og temperament — existing
- Visuel forhåndsvisning af genereret program — existing
- Arena-tegning med frihåndstegning per øvelse på 20x60 bane — existing
- Musikhåndtering med upload, BPM-detektion og WAV-mix — existing (men skal ombygges)

### Active

- [ ] Mubert API-integration: søg og generer musik efter BPM, genre og mood
- [ ] Musikvalg per gangart: brugeren vælger/genererer et nummer per gangart (skridt, trav, galop)
- [ ] Forhåndsvisning/afspilning af valgt musik direkte i browseren
- [ ] Mix-generering med valgte Mubert-numre i stedet for uploadede filer
- [ ] Persistens: gem wizard-state i localStorage så arbejdet ikke tabes ved refresh
- [ ] Dedupliker programgenerering (én funktion i src/lib/)
- [ ] Ryd op i dead code (ArenaPreview stub, ubrugt HorseProfile type, ubrugt musicPreference)

### Out of Scope

- ClicknClear-integration — afventer partnerskabsaftale, tilføjes som premium-kilde i senere milestone
- PDF/print-eksport — vigtig feature men ikke denne milestone
- 20x40 arena-support — kræver nyt letter-layout, udskydes
- Brugerkonti og authentication — client-only app foreløbigt
- Backend/database — al logik kører i browseren

## Context

- Eksisterende codebase med fungerende 6-trins wizard
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Web Audio API
- Dansk UI gennemgående (lang="da")
- Al state i useState hooks i page.tsx — ingen persistens
- Musik-stedet (step 6) er den primære udviklingszone
- ClicknClear nævnes allerede i MusicManager.tsx som anbefalet kilde
- Mubert tilbyder gratis API med BPM-kontrol (60-200), genre, mood og instruments
- Forretningsmodel: Mubert som budget-alternativ, ClicknClear som premium (senere)

## Constraints

- **API**: Mubert free tier har begrænsninger (25 tracks, 30 min/dag generering) — design UI så brugeren ikke spilder generationer
- **Client-side**: Al audio-processing skal køre i browseren (Web Audio API)
- **Licens**: Mubert free tier er kun til ikke-kommerciel brug — kommerciel licens nødvendig ved lancering
- **Eksisterende kode**: Bevar wizard-strukturen og step 1-5 uændret, fokuser ændringer på step 6 og tværgående forbedringer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mubert API som første musik-kilde | Gratis, BPM-kontrol, ingen licensproblemer under udvikling | -- Pending |
| Behold upload som fallback | Brugere der allerede har musik skal kunne bruge den | -- Pending |
| localStorage til persistens | Simpelt, ingen backend nødvendig, dækker use case | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-20 after initialization*
