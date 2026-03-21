import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import type { ArenaPath } from "@/components/ArenaCanvas";

export const STEPS = ["level", "profile", "exercises", "preview", "arena", "music"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  level: "Niveau",
  profile: "Hest",
  exercises: "Styrker",
  preview: "Program",
  arena: "Bane",
  music: "Musik",
};

export interface ProjectMeta {
  id: string;
  horseName: string;
  levelId: string;
  levelDisplayName: string;
  currentStep: Step;
  createdAt: string;
  updatedAt: string;
}

export interface MusicSettings {
  genre?: string;
  mood?: string;
  lyriaPrompts?: Record<string, string>;
}

export interface ProjectData {
  selectedLevel: KurLevel | null;
  horseName: string;
  temperament: "calm" | "neutral" | "energetic";
  exerciseRatings: Record<number, StrengthRating>;
  programOrder: number[];
  arenaPaths: ArenaPath[];
  musicSettings: MusicSettings;
  currentStep: Step;
}

export const DEFAULT_PROJECT_DATA: ProjectData = {
  selectedLevel: null,
  horseName: "",
  temperament: "neutral",
  exerciseRatings: {},
  programOrder: [],
  arenaPaths: [],
  musicSettings: {},
  currentStep: "level",
};
