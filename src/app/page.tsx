"use client";

import { useState } from "react";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { LevelSelector } from "@/components/LevelSelector";
import { ExerciseList } from "@/components/ExerciseList";
import { HorseProfileForm } from "@/components/HorseProfileForm";
import { ProgramPreview } from "@/components/ProgramPreview";

const STEPS = ["level", "profile", "exercises", "preview"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  level: "Niveau",
  profile: "Hest",
  exercises: "Styrker",
  preview: "Program",
};

export default function Home() {
  const [step, setStep] = useState<Step>("level");
  const [selectedLevel, setSelectedLevel] = useState<KurLevel | null>(null);
  const [exerciseRatings, setExerciseRatings] = useState<Record<number, StrengthRating>>({});
  const [horseName, setHorseName] = useState("");
  const [temperament, setTemperament] = useState<"calm" | "neutral" | "energetic">("neutral");
  const [musicPreference, setMusicPreference] = useState("");

  const stepIndex = STEPS.indexOf(step);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Kür Generator</h1>
          <p className="text-sm text-gray-500">Dressur kür-programmering</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-4">
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

      <div className="max-w-4xl mx-auto px-6 pb-12">
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
            musicPreference={musicPreference}
            setMusicPreference={setMusicPreference}
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
          />
        )}
      </div>
    </main>
  );
}
