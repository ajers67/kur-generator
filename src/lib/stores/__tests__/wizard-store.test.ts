import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "@/lib/stores/wizard-store";
import { DEFAULT_PROJECT_DATA } from "@/lib/types/project";
import {
  saveProjectData,
  loadProjectData,
} from "@/lib/stores/project-persistence";

describe("wizard-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useWizardStore.setState({ ...DEFAULT_PROJECT_DATA });
  });

  it("loadProject loads data from localStorage into store state", () => {
    saveProjectData("proj-1", {
      ...DEFAULT_PROJECT_DATA,
      horseName: "Loaded",
      temperament: "energetic",
    });
    useWizardStore.getState().loadProject("proj-1");
    const state = useWizardStore.getState();
    expect(state.horseName).toBe("Loaded");
    expect(state.temperament).toBe("energetic");
  });

  it("loadProject uses DEFAULT_PROJECT_DATA when no saved data exists", () => {
    // Set some non-default state first
    useWizardStore.setState({ horseName: "OldHorse", temperament: "calm" });
    useWizardStore.getState().loadProject("nonexistent");
    const state = useWizardStore.getState();
    expect(state.horseName).toBe(DEFAULT_PROJECT_DATA.horseName);
    expect(state.temperament).toBe(DEFAULT_PROJECT_DATA.temperament);
  });

  it("saveCurrentProject writes current store state to localStorage (PERS-01)", () => {
    useWizardStore.setState({ horseName: "Saved", temperament: "calm" });
    useWizardStore.getState().saveCurrentProject("proj-2");
    const loaded = loadProjectData("proj-2");
    expect(loaded).not.toBeNull();
    expect(loaded!.horseName).toBe("Saved");
    expect(loaded!.temperament).toBe("calm");
  });

  it("resetToDefaults sets all fields to DEFAULT_PROJECT_DATA values", () => {
    useWizardStore.setState({
      horseName: "Changed",
      temperament: "energetic",
      programOrder: [1, 2, 3],
    });
    useWizardStore.getState().resetToDefaults();
    const state = useWizardStore.getState();
    expect(state.horseName).toBe(DEFAULT_PROJECT_DATA.horseName);
    expect(state.temperament).toBe(DEFAULT_PROJECT_DATA.temperament);
    expect(state.programOrder).toEqual(DEFAULT_PROJECT_DATA.programOrder);
    expect(state.currentStep).toBe(DEFAULT_PROJECT_DATA.currentStep);
    expect(state.selectedLevel).toBe(DEFAULT_PROJECT_DATA.selectedLevel);
    expect(state.exerciseRatings).toEqual(DEFAULT_PROJECT_DATA.exerciseRatings);
    expect(state.arenaPaths).toEqual(DEFAULT_PROJECT_DATA.arenaPaths);
  });

  it("setLevel clears exerciseRatings and programOrder", () => {
    useWizardStore.setState({
      exerciseRatings: { 1: "strength", 2: "weakness" },
      programOrder: [1, 2],
    });
    const mockLevel = {
      id: "LA",
      name: "LA",
      description: "Let A",
      exercises: [],
      allowedGaits: ["skridt" as const, "trav" as const, "galop" as const],
      forbiddenExercises: [],
    };
    useWizardStore.getState().setLevel(mockLevel);
    const state = useWizardStore.getState();
    expect(state.selectedLevel).toEqual(mockLevel);
    expect(state.exerciseRatings).toEqual({});
    expect(state.programOrder).toEqual([]);
  });

  it("arenaPaths with points survive save/load cycle (PERS-03)", () => {
    const testPaths = [
      {
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.5, y: 0.6 },
          { x: 0.9, y: 0.8 },
        ],
        gait: "galop" as const,
        exerciseId: 5,
        exerciseName: "Galop",
      },
    ];
    useWizardStore.setState({ arenaPaths: testPaths });
    useWizardStore.getState().saveCurrentProject("arena-test");
    // Reset state
    useWizardStore.setState({ arenaPaths: [] });
    // Load it back
    useWizardStore.getState().loadProject("arena-test");
    const state = useWizardStore.getState();
    expect(state.arenaPaths).toHaveLength(1);
    expect(state.arenaPaths[0].points).toEqual([
      { x: 0.1, y: 0.2 },
      { x: 0.5, y: 0.6 },
      { x: 0.9, y: 0.8 },
    ]);
    expect(state.arenaPaths[0].gait).toBe("galop");
    expect(state.arenaPaths[0].exerciseId).toBe(5);
  });
});
