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

- [ ] Google Lyria RealTime-integration: generer musik via Gemini API med BPM, genre og mood-kontrol
- [ ] Musikgenerering per gangart: brugeren angiver stil/mood, Lyria genererer musik med korrekt BPM per gangart
- [ ] Forhåndsvisning/afspilning af genereret musik direkte i browseren
- [ ] Mix-generering med Lyria-genererede numre i stedet for uploadede filer
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
- Google Lyria RealTime (Gemini API) er gratis, BPM 60-200, genre/mood via tekstprompts, WebSocket streaming
- Forretningsmodel: Lyria som gratis AI-musik, Mubert som budget-katalog (senere), ClicknClear som premium (senere)

## Constraints

- **API**: Google Lyria er gratis men eksperimentel — kan ændre vilkår. Design med MusicProvider-abstraktion så vi kan skifte kilde
- **Client-side**: Al audio-processing skal køre i browseren (Web Audio API / WebSocket)
- **Generering tager tid**: Lyria streamer real-time — vis loading/progress UI mens musik genereres
- **Eksisterende kode**: Bevar wizard-strukturen og step 1-5 uændret, fokuser ændringer på step 6 og tværgående forbedringer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google Lyria som første musik-kilde | Gratis, BPM 60-200, genre via prompts, WebSocket streaming | -- Pending |
| Mubert droppet for nu | $49/mo API — for dyrt under udvikling, overvejes senere som katalog-alternativ | -- Pending |
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
*Last updated: 2026-03-20 after research — switched from Mubert to Google Lyria*
