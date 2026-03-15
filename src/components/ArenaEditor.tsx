"use client";

import { useState, useCallback } from "react";
import type { KurLevel, Exercise, Gait } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";
import { ArenaCanvas } from "./ArenaCanvas";
import type { ArenaPath, PathPoint } from "./ArenaCanvas";

interface Props {
  level: KurLevel;
  ratings: Record<number, StrengthRating>;
  programOrder: Exercise[];
  onPathsChange: (paths: ArenaPath[]) => void;
}

export function ArenaEditor({ level, ratings, programOrder, onPathsChange }: Props) {
  const [paths, setPaths] = useState<ArenaPath[]>([]);
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const currentExercise = programOrder[currentExerciseIndex];

  const handleMouseDown = useCallback((point: PathPoint) => {
    setIsDrawing(true);
    setCurrentPath([point]);
  }, []);

  const handleMouseMove = useCallback((point: PathPoint) => {
    setCurrentPath((prev) => {
      // Throttle points to avoid too many
      const last = prev[prev.length - 1];
      if (last) {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx * dx + dy * dy < 0.0004) return prev;
      }
      return [...prev, point];
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (currentPath.length >= 2 && currentExercise) {
      const newPath: ArenaPath = {
        points: currentPath,
        gait: currentExercise.gait,
        exerciseId: currentExercise.id,
        exerciseName: currentExercise.name,
      };
      const newPaths = [...paths, newPath];
      setPaths(newPaths);
      onPathsChange(newPaths);

      // Auto-advance to next exercise
      if (currentExerciseIndex < programOrder.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }
    }
    setCurrentPath([]);
    setIsDrawing(false);
  }, [currentPath, currentExercise, paths, onPathsChange, currentExerciseIndex, programOrder.length]);

  const undoLast = () => {
    if (paths.length > 0) {
      const newPaths = paths.slice(0, -1);
      setPaths(newPaths);
      onPathsChange(newPaths);
      if (currentExerciseIndex > 0) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
      }
    }
  };

  const clearAll = () => {
    setPaths([]);
    onPathsChange([]);
    setCurrentExerciseIndex(0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Arena */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Bane (20x60m)</h3>
            <div className="flex gap-2">
              <button
                onClick={undoLast}
                disabled={paths.length === 0}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Fortryd
              </button>
              <button
                onClick={clearAll}
                disabled={paths.length === 0}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Ryd alt
              </button>
            </div>
          </div>
          <ArenaCanvas
            width={300}
            height={450}
            paths={paths}
            currentPath={currentPath}
            currentGait={currentExercise?.gait || "trav"}
            isDrawing={isDrawing}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          {/* Gait legend */}
          <div className="flex gap-3 mt-3 text-xs">
            {(Object.entries(GAIT_COLORS) as [Gait, string][])
              .filter(([gait]) => programOrder.some((e) => e.gait === gait))
              .map(([gait, color]) => (
                <div key={gait} className="flex items-center gap-1">
                  <div
                    className="w-4 h-0.5 rounded"
                    style={{
                      backgroundColor: color,
                      borderBottom: gait === "skridt" ? "2px dashed " + color : "2px solid " + color,
                    }}
                  />
                  <span>{GAIT_LABELS[gait]}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Exercise list / current exercise */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Tegn ruten for hver øvelse
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tegn ruten på banen med musen/fingeren. Øvelserne avancerer automatisk.
          </p>

          <div className="space-y-1">
            {programOrder.map((ex, i) => {
              const isDone = i < currentExerciseIndex || (i < paths.length);
              const isCurrent = i === currentExerciseIndex;
              const rating = ratings[ex.id] || "neutral";

              return (
                <button
                  key={ex.id}
                  onClick={() => setCurrentExerciseIndex(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                    isCurrent
                      ? "bg-blue-50 border-2 border-blue-400"
                      : isDone
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: GAIT_COLORS[ex.gait] }}
                  >
                    {i + 1}
                  </span>
                  <span className={`flex-1 ${isCurrent ? "font-semibold" : ""}`}>
                    {ex.name}
                  </span>
                  {ex.coefficient === 2 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                      x2
                    </span>
                  )}
                  {rating === "strength" && (
                    <span className="text-green-600 text-xs">\u2191</span>
                  )}
                  {rating === "weakness" && (
                    <span className="text-red-600 text-xs">\u2193</span>
                  )}
                  {isDone && (
                    <span className="text-green-600 text-sm">\u2713</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current exercise highlight */}
        {currentExercise && (
          <div
            className="mt-4 rounded-xl border-2 p-4"
            style={{ borderColor: GAIT_COLORS[currentExercise.gait] + "80" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-xs text-white font-medium"
                style={{ backgroundColor: GAIT_COLORS[currentExercise.gait] }}
              >
                {GAIT_LABELS[currentExercise.gait]}
              </span>
              {currentExercise.coefficient === 2 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                  Koeff. x2
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900">{currentExercise.name}</h4>
            {currentExercise.minDistance && (
              <p className="text-sm text-gray-500 mt-1">{currentExercise.minDistance}</p>
            )}
            <p className="text-sm text-blue-700 mt-2">
              Tegn ruten for denne øvelse på banen til venstre
            </p>
          </div>
        )}

        {currentExerciseIndex >= programOrder.length && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-semibold text-green-800">Alle øvelser er tegnet!</p>
            <p className="text-sm text-green-700 mt-1">
              {paths.length} ruter tegnet. Du kan redigere ved at klikke på en øvelse.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
