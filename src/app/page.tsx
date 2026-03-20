"use client";

import { useState } from "react";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { generateProgramOrder } from "@/lib/program-generator";
import { LevelSelector } from "@/components/LevelSelector";
import { ExerciseList } from "@/components/ExerciseList";
import { HorseProfileForm } from "@/components/HorseProfileForm";
import { ProgramPreview } from "@/components/ProgramPreview";
import { ArenaEditor } from "@/components/ArenaEditor";
import { MusicManager } from "@/components/MusicManager";
import type { ArenaPath } from "@/components/ArenaCanvas";

const STEPS = ["level", "profile", "exercises", "preview", "arena", "music"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  level: "Niveau",
  profile: "Hest",
  exercises: "Styrker",
  preview: "Program",
  arena: "Bane",
  music: "Musik",
};

export default function Home() {
  const [step, setStep] = useState<Step>("level");
  const [selectedLevel, setSelectedLevel] = useState<KurLevel | null>(null);
  const [exerciseRatings, setExerciseRatings] = useState<Record<number, StrengthRating>>({});
  const [horseName, setHorseName] = useState("");
  const [temperament, setTemperament] = useState<"calm" | "neutral" | "energetic">("neutral");
  const [arenaPaths, setArenaPaths] = useState<ArenaPath[]>([]);

  const stepIndex = STEPS.indexOf(step);
  const programOrder = selectedLevel
    ? generateProgramOrder(selectedLevel, exerciseRatings, temperament)
    : [];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Kür Generator</h1>
          <p className="text-sm text-gray-500">Dressur kür-programmering</p>
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
                i === stepIndex ? "bg-blue-600" : i < stepIndex ? "bg-blue-300" : "bg-gray-200"
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
              setSelectedLevel(level);
              setExerciseRatings({});
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
            onRatingChange={(id, rating) =>
              setExerciseRatings((prev) => ({ ...prev, [id]: rating }))
            }
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
              Tegn dit program på banen
            </h2>
            <p className="text-gray-600 mb-6">
              Tegn ruten for hver øvelse direkte på banen. Brug musen eller fingeren til at tegne.
              Øvelserne avancerer automatisk.
            </p>

            <ArenaEditor
              level={selectedLevel}
              ratings={exerciseRatings}
              programOrder={programOrder}
              onPathsChange={setArenaPaths}
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
            programOrder={programOrder}
            onBack={() => setStep("arena")}
          />
        )}
      </div>
    </main>
  );
}
