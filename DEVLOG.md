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

### Næste skridt
- Fase 2: Interaktiv bane-editor (20x60/20x40) med drag & drop øvelser
- Fase 2: BPM-input og musikmatching mod royalty-free bibliotek
- Fase 3: PDF-eksport (protokol-ark + banediagrammer i Leietau-stil)
- Fase 3: AI-genereret video af programmet med hest og rytter
- Betalingsintegration (Stripe)
