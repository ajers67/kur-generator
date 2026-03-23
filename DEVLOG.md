# Kür Generator - Devlog

## Projekt
Webplatform til dressur kür-programmering med musik. Ryttere kan sammensætte deres eget kür-program baseret på officielle DRF-regler og få musikforslag matchet til hestens gangarter.

## 2026-03-14 - Projekt opstart & research

### Research udført
- Alle 7 DRF kür-protokoller indsamlet og digitaliseret (LA, LA6, Pony, Junior, Young Rider, Intermediate I, Grand Prix)
- BPM-ranges dokumenteret for alle gangarter (skridt 48-66, trav 72-90, galop 90-110, passage/piaffe ~60 BPM)
- Musikrettigheder undersøgt (KODA i DK, ClicknClear for FEI, royalty-free som løsning)
- Eksisterende konkurrenter analyseret (FEI Creator, KürFlow, Freestyle Floorplanner, Equidance, Equisonic)
- Professionelle services koster £129-$1100+ per kür - stort marked for billigere løsning

### MVP bygget (Fase 1)
- Next.js 16 + TypeScript + Tailwind CSS
- Komplet datamodel med alle 7 DRF kür-niveauer
- Obligatoriske øvelser, koefficienter, forbudte øvelser og særlige regler for hvert niveau
- 4-trins flow: Vælg niveau → Hesteprofil → Styrker/svagheder → Program-oversigt
- Hesteprofil: navn, temperament (rolig/neutral/spændt), musikpræference
- Styrke/svaghed per øvelse påvirker programrækkefølgen
- Program-generator der placerer styrker prominent og minimerer svagheder

## 2026-03-22 - Massiv fremgang: Phase 3-7

### Phase 3: Intelligent Program Generator ✓
- Komplet rewrite af programgenerator med koreografi-principper
- Musikalsk bue: Entry → Build-up → Climax → Wind-down → Finale
- Styrker placeres mod C (dommerne), svagheder skjules i hjørner
- Koefficient-vægtning, temperament-styret gangarts-sekvens
- Seeded PRNG (mulberry32) for kontrolleret variation
- Symmetri-par (venstre/højre) holdes tæt men ikke direkte efter hinanden
- 21 tests

### Phase 4: Rule Validation Engine ✓
- Pure validateProgram() funktion med 4 regelkategorier
- Manglende obligatoriske øvelser (error)
- Forbudte øvelser fra højere niveau (error)
- Lateral minimum-afstand advisory (warning)
- Entry/finale position check (error)
- ValidationBanner komponent med rød/gul/grøn states
- Real-time via useMemo i ProgramPreview

### Phase 5: Auto-generated Arena Routes ✓
- Erstattede frihåndstegning med auto-genererede ruter
- 13 øvelsestyper klassificeret (extension, halvpas, volte, pirouette, etc.)
- Route templates fra CHOREOGRAPHY-RULES.md §6
- Styrker mod C-enden, svagheder mod A/sider
- Transitions mellem ruter (grå stiplede linjer)
- Farvekodet per gangart med labels

### Phase 6: User Customization ✓
- Drag-and-drop øvelsesrækkefølge i ProgramPreview (HTML5 DnD)
- Klik+drag ruter i arena (select, move, constrain to bounds)
- customProgramOrder i wizard-store (null = genereret, array = brugertilpasset)
- Real-time sync mellem program, arena og validering
- Regeneration FJERNET (forretningsmodel: ét program per køb)

### Phase 7: Music Generation (i gang)
- MusicProvider abstraktion med factory pattern
- Suno API som standard provider (vokal + instrumental)
- Lyria RealTime som instrumental fallback
- Server-side proxy (API keys holdes ude af browser)
- MusicManager UI omskrevet: genre-vælger, per-gait prompts, playback, progress
- Mangler: Suno API key + test af generering

### Bugfixes
- Infinite re-render loop i programgenerering (Math.random → seeded PRNG)
- ValidationBanner grøn state usynlig (results.length → errors.length)

### Forretningsmodel-beslutninger
- Ét program per køb, flere programmer = flere køb
- Ingen gratis regenerering af program
- Musikstrategi: ClicknClear (partnerskab) → Suno (AI m/ vokal) → Lyria (instrumental)

## 2026-03-23 - v1.0 SHIPPED + v2.0 startet

### Phase 8: Mix Pipeline & Music Persistence ✓
- Koefficient-vægtet mix timeline (erstattet lige fordeling)
- "Download kür" WAV med crossfades mellem gangarter
- IndexedDB persistence for genereret musik
- "Start forfra" rydder musik-cache

### Musik-forbedringer
- Suno API som standard provider (vokal + instrumental)
- Sprogvælger: Dansk / Engelsk / Instrumental
- Stil/mood separeret fra sangtekst (Suno style vs lyrics)
- Dynamisk tegn-grænse baseret på gangartens varighed
- Varighed per gangart beregnet fra koefficient-vægtning
- Forbedret fejlhåndtering (429 credits-fejl med klar besked)

### v1.0 Milestone SHIPPED ✓
Alle 8 faser færdige. Komplet kür-designer med:
- Intelligent programgenerator med koreografi-principper
- Auto-genererede arena-ruter (13 øvelsestyper)
- Drag-and-drop tilpasning
- FEI/DRF regelvalidering
- AI musikgenerering (Suno/Lyria) med per-gangart tracks
- Mix pipeline med WAV download
- 91+ tests

### v2.0 Arena Animation & Video Preview startet
- Roadmap: Phase 9-11 (animation, playback, preview)
- Undersøgt AI video-generering (fal.ai, Kling, Veo) — for dyrt og upræcist for dressur
- Beslutning: Top-down arena animation først, AI video som v3 (LoRA fine-tuning)

### Phase 9: Arena Animation Engine ✓
- `animation-timeline.ts`: buildAnimationTimeline, getPositionAtTime
- `useAnimationPlayer` hook: rAF loop, play/pause/seek/setSpeed
- ArenaCanvas: farvet markør med trail-effekt
- ArenaRouteView: play/stop, hastighedskontrol, tidsdisplay
- 106 tests (15 nye for animation)

### Næste skridt
- Phase 10: Playback Controls & Music Sync (musik afspilles synkroniseret med animation)
- Phase 11: Video Preview Mode (fuldskærm, tidslinje)
- Top op Suno credits og test musikgenerering end-to-end
- PDF-eksport (fremtidig milestone)
- ClicknClear-integration (afventer partnerskab)
- Betalingsintegration (Stripe)
