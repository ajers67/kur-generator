"use client";

import { useState } from "react";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { LevelSelector } from "@/components/LevelSelector";
import { ExerciseList } from "@/components/ExerciseList";
import { HorseProfileForm } from "@/components/HorseProfileForm";
import { ProgramPreview } from "@/components/ProgramPreview";
import { ArenaEditor } from "@/components/ArenaEditor";
import type { ArenaPath } from "@/components/ArenaCanvas";

const STEPS = ["level", "profile", "exercises", "preview", "arena"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  level: "Niveau",
  profile: "Hest",
  exercises: "Styrker",
  preview: "Program",
  arena: "Bane",
};

function generateProgramOrder(
  level: KurLevel,
  ratings: Record<number, StrengthRating>,
  temperament: "calm" | "neutral" | "energetic"
): Exercise[] {
  const exercises = [...level.exercises];
  const skridt = exercises.filter((e) => e.gait === "skridt");
  const trav = exercises.filter((e) => e.gait === "trav");
  const galop = exercises.filter((e) => e.gait === "galop");
  const overgang = exercises.filter((e) => e.gait === "overgang");
  const passage = exercises.filter((e) => e.gait === "passage");
  const piaffe = exercises.filter((e) => e.gait === "piaffe");

  const sortByStrength = (a: Exercise, b: Exercise) => {
    const order: Record<StrengthRating, number> = { strength: 0, neutral: 1, weakness: 2 };
    return (order[ratings[a.id] || "neutral"]) - (order[ratings[b.id] || "neutral"]);
  };

  trav.sort(sortByStrength);
  galop.sort(sortByStrength);

  const entryExercise = overgang.find((e) => e.name.includes("Indridning"));
  const restOvergang = overgang.filter((e) => !e.name.includes("Indridning"));

  let program: Exercise[] = [];
  if (entryExercise) program.push(entryExercise);

  if (temperament === "calm") {
    program = [...program, ...skridt, ...trav, ...galop];
  } else if (temperament === "energetic") {
    program = [...program, ...trav, ...galop.slice(0, Math.ceil(galop.length / 2)), ...skridt, ...galop.slice(Math.ceil(galop.length / 2))];
  } else {
    program = [...program, ...trav, ...skridt, ...galop];
  }

  program = [...program, ...passage, ...piaffe, ...restOvergang];

  const seen = new Set<number>();
  return program.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export default function Home() {
  const [step, setStep] = useState<Step>("level");
  const [selectedLevel, setSelectedLevel] = useState<KurLevel | null>(null);
  const [exerciseRatings, setExerciseRatings] = useState<Record<number, StrengthRating>>({});
  const [horseName, setHorseName] = useState("");
  const [temperament, setTemperament] = useState<"calm" | "neutral" | "energetic">("neutral");
  const [musicPreference, setMusicPreference] = useState("");
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
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
