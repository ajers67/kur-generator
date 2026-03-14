export type StrengthRating = "strength" | "neutral" | "weakness";

export interface HorseProfile {
  name: string;
  level: string;
  bpm: {
    walk?: number;
    trot?: number;
    canter?: number;
    passage?: number;
  };
  temperament: "calm" | "neutral" | "energetic";
  exerciseRatings: Record<number, StrengthRating>;
  gaitStrengths: Record<string, StrengthRating>;
  preferredStartGait: "trav" | "galop" | "any";
  musicPreference: string;
}

export const TEMPERAMENT_OPTIONS = [
  { value: "calm" as const, label: "Rolig/afslappet", description: "Kan starte med skridt, behøver ikke opvarmning" },
  { value: "neutral" as const, label: "Neutral", description: "Fleksibel rækkefølge" },
  { value: "energetic" as const, label: "Spændt/frisk", description: "Start med trav/galop, skridt senere når hesten er faldet til ro" },
];

export const MUSIC_GENRES = [
  "Filmmusik",
  "Klassisk",
  "Pop/rock instrumental",
  "Latin/flamenco",
  "Jazz",
  "Keltisk/folk",
  "Musical/showtunes",
  "Elektronisk/ambient",
  "Andet",
];
