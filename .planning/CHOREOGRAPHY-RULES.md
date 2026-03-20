# Koreografi-principper for FreestyleMaker

> Denne fil er det levende dokument for hvordan vi genererer kür-programmer.
> Opdateres løbende når vi får nye indsigter, feedback fra ryttere, eller ændringer i regelsæt.

## Kilder

- [FEI Freestyle Creator Manual (2023)](https://dressagefreestyle.fei.org/data/pdf/Creator-Manual.pdf)
- [FEI: Creating a Fantastic Freestyle](https://www.fei.org/stories/freestyle-dressage-choreography)
- [Ruth Hogan-Poulsen: Freestyle Choreography](https://ruthhoganpoulsen.com/dressage-freestyle-choreography/)
- [Mad Barn: Dressage Freestyle Guide](https://madbarn.com/musical-dressage-freestyle/)
- [HorseSport: Understanding Freestyle Scores](https://horsesport.com/magazine/training/understanding-improving-freestyle-dressage-scores/)
- [SmartPak: 5 Steps to Design a Freestyle](https://www.smartpakequine.com/learn-products/how-to-design-a-musical-freestyle)

---

## 1. Overordnet struktur: Den musikalske bue

Ethvert kür-program skal følge en musikalsk bue:

```
Indridning (rolig, sætter stemningen)
  → Opbygning (stigende intensitet)
    → Klimaks (de sværeste/mest imponerende øvelser)
      → Afvikling (fald i intensitet)
        → Afslutning (halt, hilsen)
```

**Regler:**
- Indridning er ALTID første øvelse
- Afslutning (halt/hilsen) er ALTID sidste øvelse
- Sværere øvelser placeres i sidste halvdel (stærkere indtryk på dommeren)
- Indbyg "pauser" (skridt-passager) mellem intense sektioner

---

## 2. Styrker og svagheder: Placering i banen

Styrker og svagheder handler IKKE om rækkefølge alene, men om **placering i banen**:

### Styrker (rating: "strength")
- Placér mod **C-enden** (hvor dommerne sidder)
- Brug **diagonaler** for extensions og lengthenings (maksimal synlighed)
- Giv **mere plads** — lad øvelsen udfolde sig fuldt
- Extended galop ser bedst ud mod C på en diagonal

### Svagheder (rating: "weakness")
- Placér langs **lange sider** eller i **hjørner** (mindre synligt)
- Hold dem **korte** — f.eks. kort halvpas til den svage side
- Placér dem **ikke** direkte foran dommerne
- Brug overgange eller hjørner til at "skjule" dem

### Neutral (rating: "neutral")
- Standard placering — fylder mellemrummet
- Kan bruges fleksibelt til at skabe flow

---

## 3. Koefficient-vægtning

Koreografi har den **højeste koefficient** i bedømmelsen:

| Bedømmelse | Koefficient |
|-----------|-------------|
| Koreografi | 4 |
| Harmoni (rytter/hest) | 3 |
| Musik | 3 |
| Sværhedsgrad | 2 |

**Konsekvens for generatoren:**
- Øvelser med høj koefficient (fx coefficient: 2 i data) skal have **bedre placering**
- En smart opbygning scorer potentielt mere end svære øvelser
- Variation og kreativitet i koreografi belønnes — undgå "set-test rækkefølge"

---

## 4. Temperament-strategi

Hestens temperament påvirker **gangarts-rækkefølgen**, ikke øvelses-rækkefølgen:

### Rolig hest ("calm")
- Start med skridt → trav → galop (gradvis opbygning)
- Hesten har brug for at "vågne op" langsomt
- Gem de energiske øvelser til hesten er varm

### Energisk hest ("energetic")
- Start med trav → galop tidligt (brug energien)
- Skridt som pause i midten (hesten har brug for at lade ned)
- Undgå for lang skridt-sektion i starten (hesten bliver utålmodig)

### Neutral ("neutral")
- Standard: trav → skridt → galop
- Balanceret opbygning

---

## 5. Symmetri og balance

- Øvelser der kræves på begge hænder (halvpas, skulderhind osv.) skal fordeles jævnt
- Vis den **stærke side** længere og mod dommeren
- Vis den **svage side** kortere og i mindre synlige zoner
- Undgå at alle højre-øvelser kommer i træk og derefter alle venstre

---

## 6. Rute-principper per øvelsestype

| Øvelsestype | Foretrukken rute |
|-------------|------------------|
| Extension/lengthening | Diagonal (max synlighed og plads) |
| Halvpas | Diagonal eller langs centerlinjen |
| Skulderhind/travers | Langs lange side |
| Pirouette | Ved centerlinjen eller nær C |
| Passage | Centerlinje mod C (showpiece) |
| Piaffe | Ved X eller nær C (synlig) |
| Skridt | Langs lange side (pause, genopretning) |
| Overgang/kombination | Hjørner eller kort side |
| Indridning | A → X (standard) |

---

## 7. FEI/DRF-regler (hårde krav)

Disse SKAL overholdes — brud = straf eller diskvalifikation:

- [ ] Alle obligatoriske øvelser for niveauet SKAL udføres
- [ ] Laterale bevægelser SKAL dække minimum 12 meter
- [ ] Øvelser fra HØJERE niveau er FORBUDT
- [ ] Kombinationer skal udføres tæt (inden for få meter)
- [ ] Programmet skal holde sig inden for tidsrammen for niveauet
- [ ] Indridning via A, afslutning med halt/hilsen

---

## 8. Variation og kreativitet

For at undgå at generatoren altid producerer det samme program:

- **Kontrolleret randomisering** af rækkefølge inden for gangarts-grupper
- **Flere rute-varianter** per øvelsestype (fx extensions kan være M→K, H→F, eller F→H diagonal)
- **Swap-mulighed** for øvelser med lignende krav (venstre/højre først)
- Dommere belønner "element of surprise and adventure" — undgå at kopiere set-test rækkefølgen

---

## 9. Anti-patterns (hvad vi IKKE gør)

- Simpel "styrker først" sortering — det er ikke sådan professionelle kür'er bygges
- Identisk program hver gang — dommere kan genkende "robot-koreografi"
- Ignorere koefficienter — koreografi-scoren er den tungeste
- For mange gangartsskift — det virker rodet og stresset
- Alle svagheder samlet til sidst — det efterlader et dårligt indtryk

---

*Sidst opdateret: 2026-03-21*
*Næste planlagt review: efter Phase 3 (Intelligent Program Generator) er implementeret*
