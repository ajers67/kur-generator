export type StrengthRating = "strength" | "neutral" | "weakness";

export const TEMPERAMENT_OPTIONS = [
  { value: "calm" as const, label: "Rolig/afslappet", description: "Kan starte med skridt, behøver ikke opvarmning" },
  { value: "neutral" as const, label: "Neutral", description: "Fleksibel rækkefølge" },
  { value: "energetic" as const, label: "Spændt/frisk", description: "Start med trav/galop, skridt senere når hesten er faldet til ro" },
];
