"use client";

import { useEffect, useMemo, useRef } from "react";
import { useHydrated } from "@/lib/use-hydration";
import { useProjectStore } from "@/lib/stores/project-store";
import { useWizardStore } from "@/lib/stores/wizard-store";
import { STEPS, STEP_LABELS } from "@/lib/types/project";
import type { Step } from "@/lib/types/project";
import { KUR_LEVELS } from "@/data/kur-levels";
import { generateProgramOrder } from "@/lib/program-generator";
import { ProjectSelector } from "@/components/ProjectSelector";
import { LevelSelector } from "@/components/LevelSelector";
import { ExerciseList } from "@/components/ExerciseList";
import { HorseProfileForm } from "@/components/HorseProfileForm";
import { ProgramPreview } from "@/components/ProgramPreview";
import { ArenaRouteView } from "@/components/ArenaRouteView";
import { MusicManager } from "@/components/MusicManager";

export default function Home() {
  const hydrated = useHydrated();

  // Project store
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);

  // Wizard store — state
  const selectedLevel = useWizardStore((s) => s.selectedLevel);
  const horseName = useWizardStore((s) => s.horseName);
  const temperament = useWizardStore((s) => s.temperament);
  const exerciseRatings = useWizardStore((s) => s.exerciseRatings);
  const programOrder = useWizardStore((s) => s.programOrder);
  const arenaPaths = useWizardStore((s) => s.arenaPaths);
  const step = useWizardStore((s) => s.currentStep);

  // Wizard store — actions
  const setLevel = useWizardStore((s) => s.setLevel);
  const setHorseName = useWizardStore((s) => s.setHorseName);
  const setTemperament = useWizardStore((s) => s.setTemperament);
  const setExerciseRating = useWizardStore((s) => s.setExerciseRating);
  const setProgramOrder = useWizardStore((s) => s.setProgramOrder);
  const setArenaPaths = useWizardStore((s) => s.setArenaPaths);
  const setStep = useWizardStore((s) => s.setStep);
  const loadProject = useWizardStore((s) => s.loadProject);
  const saveCurrentProject = useWizardStore((s) => s.saveCurrentProject);

  const stepIndex = STEPS.indexOf(step);

  // Derived program order — stable seed from level+ratings+temperament to prevent infinite re-renders
  const programSeed = useMemo(() => {
    if (!selectedLevel) return 0;
    const ratingStr = Object.entries(exerciseRatings).sort(([a], [b]) => Number(a) - Number(b)).map(([k, v]) => `${k}:${v}`).join(",");
    let hash = 0;
    const str = `${selectedLevel.id}-${temperament}-${ratingStr}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }, [selectedLevel, exerciseRatings, temperament]);

  const computedProgramOrder = useMemo(
    () => selectedLevel
      ? generateProgramOrder(selectedLevel, exerciseRatings, temperament, { seed: programSeed })
      : [],
    [selectedLevel, exerciseRatings, temperament, programSeed]
  );

  // Sync derived programOrder into store for persistence
  const prevOrderRef = useRef<string>("");
  useEffect(() => {
    if (computedProgramOrder.length === 0) return;
    const key = computedProgramOrder.map((e) => e.id).join(",");
    if (key !== prevOrderRef.current) {
      prevOrderRef.current = key;
      setProgramOrder(computedProgramOrder.map((e) => e.id));
    }
  }, [computedProgramOrder, setProgramOrder]);

  // Auto-save wizard state when it changes
  useEffect(() => {
    if (!activeProjectId) return;
    saveCurrentProject(activeProjectId);
    updateProjectMeta(activeProjectId, {
      horseName,
      levelId: selectedLevel?.id ?? "",
      levelDisplayName: selectedLevel?.displayName ?? "",
      currentStep: step,
    });
  }, [activeProjectId, selectedLevel, horseName, temperament, exerciseRatings, arenaPaths, step, saveCurrentProject, updateProjectMeta]);

  // Hydration guard
  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Kur Generator</h1>
            <p className="text-sm text-gray-500">Dressur kur-programmering</p>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-400">
          Indlaeser...
        </div>
      </main>
    );
  }

  // Project selection handlers
  const handleProjectSelected = (id: string) => {
    setActiveProject(id);
    loadProject(id);
  };

  const handleStartForfra = () => {
    if (!activeProjectId) return;
    if (
      window.confirm(
        "Er du sikker på at du vil starte forfra? Dit projekt bliver slettet.",
      )
    ) {
      useProjectStore.getState().deleteProject(activeProjectId);
      useWizardStore.getState().resetToDefaults();
    }
  };

  const handleBackToProjects = () => {
    if (activeProjectId) {
      saveCurrentProject(activeProjectId);
    }
    setActiveProject(null);
  };

  // No active project — show project selector
  if (!activeProjectId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Kur Generator</h1>
            <p className="text-sm text-gray-500">Dressur kur-programmering</p>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6">
          <ProjectSelector onProjectSelected={handleProjectSelected} />
        </div>
      </main>
    );
  }

  // Active project — wizard view
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Kur Generator</h1>
            <span className="text-sm text-gray-500">
              — {horseName || "Nyt projekt"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToProjects}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Tilbage til projekter
            </button>
            <button
              onClick={handleStartForfra}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Start forfra
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (i === 0 || selectedLevel) setStep(s);
              }}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i === stepIndex
                  ? "bg-blue-600"
                  : i < stepIndex
                    ? "bg-blue-300"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {STEPS.map((s) => (
            <span key={s}>{STEP_LABELS[s]}</span>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {step === "level" && (
          <LevelSelector
            levels={KUR_LEVELS}
            onSelect={(level) => {
              setLevel(level);
              setStep("profile");
            }}
          />
        )}

        {step === "profile" && selectedLevel && (
          <HorseProfileForm
            horseName={horseName}
            setHorseName={setHorseName}
            temperament={temperament}
            setTemperament={setTemperament}
            onNext={() => setStep("exercises")}
            onBack={() => setStep("level")}
          />
        )}

        {step === "exercises" && selectedLevel && (
          <ExerciseList
            level={selectedLevel}
            ratings={exerciseRatings}
            onRatingChange={(id, rating) => setExerciseRating(id, rating)}
            onNext={() => setStep("preview")}
            onBack={() => setStep("profile")}
          />
        )}

        {step === "preview" && selectedLevel && (
          <ProgramPreview
            level={selectedLevel}
            ratings={exerciseRatings}
            horseName={horseName}
            temperament={temperament}
            onBack={() => setStep("exercises")}
            onNext={() => setStep("arena")}
          />
        )}

        {step === "arena" && selectedLevel && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ruter i banen
            </h2>
            <p className="text-gray-600 mb-6">
              Ruterne er automatisk genereret baseret på øvelsestyper og
              styrker/svagheder. Klik &apos;Gener nye ruter&apos; for et nyt forslag.
            </p>

            <ArenaRouteView
              programOrder={computedProgramOrder}
              ratings={exerciseRatings}
              onRoutesGenerated={setArenaPaths}
            />

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("preview")}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Tilbage
              </button>
              <button
                onClick={() => setStep("music")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Næste: Musik
              </button>
            </div>
          </div>
        )}

        {step === "music" && selectedLevel && (
          <MusicManager
            level={selectedLevel}
            programOrder={computedProgramOrder}
            onBack={() => setStep("arena")}
          />
        )}
      </div>
    </main>
  );
}
