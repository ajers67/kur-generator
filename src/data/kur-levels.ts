export type Gait = "skridt" | "trav" | "galop" | "passage" | "piaffe" | "overgang";

export interface Exercise {
  id: number;
  name: string;
  gait: Gait;
  coefficient: number;
  minDistance?: string;
  description?: string;
}

export interface ForbiddenRule {
  description: string;
  penalty: string;
}

export interface ArtisticMark {
  id: number;
  name: string;
  description: string;
  coefficient: number;
}

export interface KurLevel {
  id: string;
  name: string;
  displayName: string;
  timeMin: string;
  timeMax: string;
  maxScore: number;
  technicalTotal: number;
  technicalDivisor: number;
  minAge?: string;
  arenaSize: "20x40" | "20x60" | "both";
  exercises: Exercise[];
  artisticMarks: ArtisticMark[];
  forbidden: ForbiddenRule[];
  specialRules: string[];
}

const ARTISTIC_MARKS_STANDARD: ArtisticMark[] = [
  { id: 1, name: "Rytme", description: "Takt, energi og elasticitet (spændstighed)", coefficient: 4 },
  { id: 2, name: "Harmoni", description: "Harmoni mellem hest og rytter", coefficient: 4 },
  { id: 3, name: "Koreografi", description: "Udnyttelse af banen. Opfindsomhed", coefficient: 4 },
  { id: 4, name: "Sværhedsgrad", description: "Veldisponerede chancer / risici", coefficient: 4 },
  { id: 5, name: "Musik", description: "Valg af musik. Udnyttelse og fortolkning af musikken", coefficient: 4 },
];

export const KUR_LEVELS: KurLevel[] = [
  {
    id: "la",
    name: "LA Kür",
    displayName: "LA Kür (Sværhedsgrad 1)",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 370,
    technicalTotal: 170,
    technicalDivisor: 1.7,
    minAge: "Hest min. 5 år",
    arenaSize: "both",
    exercises: [
      { id: 1, name: "Middelskridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Arbejdstrav", gait: "trav", coefficient: 1 },
      { id: 3, name: "Volte 10 meter til venstre", gait: "trav", coefficient: 1 },
      { id: 4, name: "Volte 10 meter til højre", gait: "trav", coefficient: 1 },
      { id: 5, name: "Schenkelvigning i trav til venstre", gait: "trav", coefficient: 2 },
      { id: 6, name: "Schenkelvigning i trav til højre", gait: "trav", coefficient: 2 },
      { id: 7, name: "Middeltrav", gait: "trav", coefficient: 1 },
      { id: 8, name: "Arbejdsgalop", gait: "galop", coefficient: 1 },
      { id: 9, name: "Middelgalop", gait: "galop", coefficient: 1 },
      { id: 10, name: "Kontragalop til venstre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 11, name: "Kontragalop til højre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 12, name: "Changér galop gennem skridt (H→V)", gait: "galop", coefficient: 1 },
      { id: 13, name: "Changér galop gennem skridt (V→H)", gait: "galop", coefficient: 1 },
      { id: 14, name: "Indridning samt indridnings- og afslutningsparade", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Øvelser over LA-niveau", penalty: "0 for øvelsen + max 5.0 i koreografi/sværhedsgrad" },
    ],
    specialRules: [
      "Skridt skal vises min. 20m på ét spor (lige eller buet). Kun sideførende skridt → under 5.0",
    ],
  },
  {
    id: "la6",
    name: "LA6 Kür",
    displayName: "LA6 Kür (Sværhedsgrad 2)",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    minAge: "Hest min. 5 år",
    arenaSize: "both",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Fri skridt", gait: "skridt", coefficient: 2, minDistance: "min. 20 meter" },
      { id: 3, name: "Halvpirouette i samlet skridt (H og/eller V)", gait: "skridt", coefficient: 1 },
      { id: 4, name: "Versade bøjet til venstre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 5, name: "Versade bøjet til højre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 6, name: "Sidetraversade til venstre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 7, name: "Sidetraversade til højre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 8, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 9, name: "Kontragalop til venstre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 10, name: "Kontragalop til højre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 11, name: "Changér galop gennem skridt V→H (3-5 skridt)", gait: "galop", coefficient: 2 },
      { id: 12, name: "Changér galop gennem skridt H→V (3-5 skridt)", gait: "galop", coefficient: 2 },
      { id: 13, name: "Samlet galop inkl. volte 8m (H og/eller V)", gait: "galop", coefficient: 1 },
      { id: 14, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 15, name: "Indridning samt indridnings- og afslutningsparade", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Øvelser over sværhedsgrad 2", penalty: "Diskvalifikation" },
    ],
    specialRules: [
      "Mere end halvpirouette i skridt (>180°) → karakter 0 for pirouette",
      "Skridt kun vist som sideførende → 0 for øvelsen",
      "Renversader er tilladt",
    ],
  },
  {
    id: "pony",
    name: "Pony Kür",
    displayName: "Pony Kür",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    minAge: "Pony min. 6 år",
    arenaSize: "both",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Fri skridt", gait: "skridt", coefficient: 2, minDistance: "min. 20 meter" },
      { id: 3, name: "Halvpirouette i samlet skridt (H og/eller V)", gait: "skridt", coefficient: 1 },
      { id: 4, name: "Versade bøjet til venstre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 5, name: "Versade bøjet til højre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 6, name: "Sidetraversade til venstre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 7, name: "Sidetraversade til højre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 8, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 9, name: "Kontragalop til venstre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 10, name: "Kontragalop til højre", gait: "galop", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 11, name: "Changér galop gennem skridt V→H (3-5 skridt)", gait: "galop", coefficient: 2 },
      { id: 12, name: "Changér galop gennem skridt H→V (3-5 skridt)", gait: "galop", coefficient: 2 },
      { id: 13, name: "Samlet galop inkl. volte 8m (H og/eller V)", gait: "galop", coefficient: 1 },
      { id: 14, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 15, name: "Indridning samt indridnings- og afslutningsparade", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Changement (flyvende skift)", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Galoptravers", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Galoppirouetter", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Piaffe og passage", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
    ],
    specialRules: [
      "Mere end halvpirouette i skridt (>180°) → under 5.0 for pirouette",
      "Skridt skal vises min. 20m på ét spor, må afbrydes af ½ skridtpirouette (180°)",
      "Mere end 1 omskift i trav travers er tilladt",
    ],
  },
  {
    id: "junior",
    name: "Junior Kür",
    displayName: "Junior Kür",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    arenaSize: "20x60",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Halvpirouette i samlet skridt (H og/eller V)", gait: "skridt", coefficient: 1 },
      { id: 3, name: "Fri skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 4, name: "Samlet trav", gait: "trav", coefficient: 1 },
      { id: 5, name: "Versade bøjet til højre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 6, name: "Versade bøjet til venstre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 7, name: "Sidetraversade til højre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 8, name: "Sidetraversade til venstre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 9, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 10, name: "Samlet galop", gait: "galop", coefficient: 1 },
      { id: 11, name: "Galop travers til højre (samlet galop)", gait: "galop", coefficient: 1 },
      { id: 12, name: "Galop travers til venstre (samlet galop)", gait: "galop", coefficient: 1 },
      { id: 13, name: "Changement til højre", gait: "galop", coefficient: 2 },
      { id: 14, name: "Changement til venstre", gait: "galop", coefficient: 2 },
      { id: 15, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 16, name: "Indridning samt indridnings- og afslutningsparade", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Serie-changementer (hvert 4. spring eller mindre)", penalty: "Under 5.0 for alle changementer" },
      { description: "Pirouetter i galop", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Piaffe og passage", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
    ],
    specialRules: [
      "Mere end halvpirouette i skridt (>180°) → under 5.0 for pirouette",
      "Skridt skal vises min. 20m på ét spor (lige eller buet)",
      "Changementer må IKKE vises som serie → under 5.0 for alle changementer",
      "Max ét retningsskift i galoptravers (ingen zig-zag) → under 5.0 for begge galoptraverser",
      "Zig-zag i trav ER tilladt, vinkler op til rytteren",
    ],
  },
  {
    id: "young-rider",
    name: "Young Rider Kür",
    displayName: "Young Rider Kür",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    arenaSize: "20x60",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Fri skridt", gait: "skridt", coefficient: 2, minDistance: "min. 20 meter" },
      { id: 3, name: "Versade bøjet til højre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 4, name: "Versade bøjet til venstre (samlet trav)", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 5, name: "Sidetraversade til højre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 6, name: "Sidetraversade til venstre (samlet trav)", gait: "trav", coefficient: 2 },
      { id: 7, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 8, name: "Galop travers til højre (samlet galop)", gait: "galop", coefficient: 1 },
      { id: 9, name: "Galop travers til venstre (samlet galop)", gait: "galop", coefficient: 1 },
      { id: 10, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 11, name: "Changement for hvert 4. spring (min. 5 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 12, name: "Changement for hvert 3. spring (min. 5 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 13, name: "Halvpirouette i galop til højre", gait: "galop", coefficient: 2 },
      { id: 14, name: "Halvpirouette i galop til venstre", gait: "galop", coefficient: 2 },
      { id: 15, name: "Indridning samt indridnings- og afslutningsparade", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Serie-changementer for hvert 2. spring eller mindre", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Hel pirouette i galop (>180°)", penalty: "Under 5.0 for pirouetter" },
      { description: "Piaffe og passage", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
    ],
    specialRules: [
      "Skridt skal vises min. 20m på ét spor",
      "Halvpirouette i galop >180° → under 5.0 (kun for den pågældende side)",
      "Zig-zag travers i galop ER tilladt, vinkler op til rytteren",
      "Halvpirouette i galop skal udføres fra/til samlet galop for høj karakter",
      "Halvpirouette kun fra galoptravers til galoptravers → utilstrækkelig karakter",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate I Kür",
    displayName: "Intermediate I Kür",
    timeMin: "4:30",
    timeMax: "5:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    arenaSize: "20x60",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Fri skridt", gait: "skridt", coefficient: 2, minDistance: "min. 20 meter" },
      { id: 3, name: "Samlet trav inkl. versade bøjet til højre", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 4, name: "Samlet trav inkl. versade bøjet til venstre", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 5, name: "Samlet trav inkl. sidetraversade til højre", gait: "trav", coefficient: 2 },
      { id: 6, name: "Samlet trav inkl. sidetraversade til venstre", gait: "trav", coefficient: 2 },
      { id: 7, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 8, name: "Samlet galop inkl. sidetraversade til højre", gait: "galop", coefficient: 1 },
      { id: 9, name: "Samlet galop inkl. sidetraversade til venstre", gait: "galop", coefficient: 1 },
      { id: 10, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 11, name: "Changementer for hvert 3. spring (min. 5 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 12, name: "Changementer for hvert 2. spring (min. 5 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 13, name: "Enkelt-pirouette i galop til højre", gait: "galop", coefficient: 2 },
      { id: 14, name: "Enkelt-pirouette i galop til venstre", gait: "galop", coefficient: 2 },
      { id: 15, name: "Indridning samt indridnings- og afslutningsparader", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [
      { description: "Serie-changementer for hvert galopspring", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
      { description: "Mere end 360° pirouetter i galop", penalty: "Under 5.0 for pirouetter" },
      { description: "Piaffe og passage", penalty: "Max 5.5 i koreografi/sværhedsgrad" },
    ],
    specialRules: [
      "Skridt skal vises min. 20m på ét spor",
      "Mere end enkelt pirouette (>360°) → under 5.0",
      "Galoppirouette skal udføres fra/til samlet galop for høj karakter",
      "Pirouetter kun fra skridt til skridt → under 5.0, max 5.5 koreografi/sværhedsgrad",
      "Udridning i skridt for lange tøjler",
    ],
  },
  {
    id: "grand-prix",
    name: "Grand Prix Kür",
    displayName: "Grand Prix Kür",
    timeMin: "5:30",
    timeMax: "6:00",
    maxScore: 400,
    technicalTotal: 200,
    technicalDivisor: 2,
    arenaSize: "20x60",
    exercises: [
      { id: 1, name: "Samlet skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 2, name: "Fri skridt", gait: "skridt", coefficient: 1, minDistance: "min. 20 meter" },
      { id: 3, name: "Samlet trav inkl. sidetraversade til højre", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 4, name: "Samlet trav inkl. sidetraversade til venstre", gait: "trav", coefficient: 1, minDistance: "min. 12 meter" },
      { id: 5, name: "Fri trav", gait: "trav", coefficient: 1 },
      { id: 6, name: "Samlet galop inkl. sidetraversade til højre", gait: "galop", coefficient: 1 },
      { id: 7, name: "Samlet galop inkl. sidetraversade til venstre", gait: "galop", coefficient: 1 },
      { id: 8, name: "Fri galop", gait: "galop", coefficient: 1 },
      { id: 9, name: "Changementer for hvert 2. spring (min. 5 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 10, name: "Changement for hvert spring (min. 9 sammenhængende)", gait: "galop", coefficient: 1 },
      { id: 11, name: "Galop pirouette til højre", gait: "galop", coefficient: 2 },
      { id: 12, name: "Galop pirouette til venstre", gait: "galop", coefficient: 2 },
      { id: 13, name: "Passage", gait: "passage", coefficient: 2, minDistance: "min. 15 meter" },
      { id: 14, name: "Piaffe", gait: "piaffe", coefficient: 2, minDistance: "min. 10 trin på lige spor" },
      { id: 15, name: "Overgange fra passage til piaffe og omvendt", gait: "overgang", coefficient: 1 },
      { id: 16, name: "Indridning samt indridnings- og afslutningsparader", gait: "overgang", coefficient: 1 },
    ],
    artisticMarks: ARTISTIC_MARKS_STANDARD,
    forbidden: [],
    specialRules: [
      "Tidsstraf: mere end max/mindre end min → fratræk 0.5% fra kunstnerisk total",
    ],
  },
];

export const GAIT_COLORS: Record<Gait, string> = {
  skridt: "#1a1a1a",
  trav: "#2563eb",
  galop: "#dc2626",
  passage: "#7c3aed",
  piaffe: "#9333ea",
  overgang: "#6b7280",
};

export const GAIT_LABELS: Record<Gait, string> = {
  skridt: "Skridt",
  trav: "Trav",
  galop: "Galop",
  passage: "Passage",
  piaffe: "Piaffe",
  overgang: "Overgang",
};
