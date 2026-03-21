import { create } from "zustand";
import type { ProjectData, Step, MusicSettings } from "@/lib/types/project";
import { DEFAULT_PROJECT_DATA } from "@/lib/types/project";
import { saveProjectData, loadProjectData } from "@/lib/stores/project-persistence";
import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import type { ArenaPath } from "@/components/ArenaCanvas";

interface WizardState extends ProjectData {
  setLevel: (level: KurLevel) => void;
  setHorseName: (name: string) => void;
  setTemperament: (t: "calm" | "neutral" | "energetic") => void;
  setExerciseRating: (id: number, rating: StrengthRating) => void;
  setProgramOrder: (order: number[]) => void;
  setArenaPaths: (paths: ArenaPath[]) => void;
  setMusicSettings: (settings: MusicSettings) => void;
  setStep: (step: Step) => void;
  loadProject: (id: string) => void;
  saveCurrentProject: (id: string) => void;
  resetToDefaults: () => void;
}

export const useWizardStore = create<WizardState>()((set, get) => ({
  ...DEFAULT_PROJECT_DATA,

  setLevel: (level: KurLevel) => {
    set({ selectedLevel: level, exerciseRatings: {}, programOrder: [] });
  },

  setHorseName: (name: string) => {
    set({ horseName: name });
  },

  setTemperament: (t: "calm" | "neutral" | "energetic") => {
    set({ temperament: t });
  },

  setExerciseRating: (id: number, rating: StrengthRating) => {
    set((state) => ({
      exerciseRatings: { ...state.exerciseRatings, [id]: rating },
    }));
  },

  setProgramOrder: (order: number[]) => {
    set({ programOrder: order });
  },

  setArenaPaths: (paths: ArenaPath[]) => {
    set({ arenaPaths: paths });
  },

  setMusicSettings: (settings: MusicSettings) => {
    set({ musicSettings: settings });
  },

  setStep: (step: Step) => {
    set({ currentStep: step });
  },

  loadProject: (id: string) => {
    const data = loadProjectData(id);
    if (data) {
      set({
        selectedLevel: data.selectedLevel,
        horseName: data.horseName,
        temperament: data.temperament,
        exerciseRatings: data.exerciseRatings,
        programOrder: data.programOrder,
        arenaPaths: data.arenaPaths,
        musicSettings: data.musicSettings,
        currentStep: data.currentStep,
      });
    } else {
      set({ ...DEFAULT_PROJECT_DATA });
    }
  },

  saveCurrentProject: (id: string) => {
    const state = get();
    const data: ProjectData = {
      selectedLevel: state.selectedLevel,
      horseName: state.horseName,
      temperament: state.temperament,
      exerciseRatings: state.exerciseRatings,
      programOrder: state.programOrder,
      arenaPaths: state.arenaPaths,
      musicSettings: state.musicSettings,
      currentStep: state.currentStep,
    };
    saveProjectData(id, data);
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_PROJECT_DATA });
  },
}));
