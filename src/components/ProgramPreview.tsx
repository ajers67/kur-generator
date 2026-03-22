"use client";

import { useState, useMemo, useCallback } from "react";
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";
import { validateProgram } from "@/lib/rule-validator";
import { ValidationBanner } from "./ValidationBanner";

interface Props {
  level: KurLevel;
  ratings: Record<number, StrengthRating>;
  horseName: string;
  temperament: "calm" | "neutral" | "energetic";
  programOrder: Exercise[];
  onReorder: (order: number[] | null) => void;
  onBack: () => void;
  onNext?: () => void;
}

function reorderExercises(list: Exercise[], fromIndex: number, toIndex: number): Exercise[] {
  const result = [...list];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function ProgramPreview({ level, ratings, horseName, temperament, programOrder, onReorder, onBack, onNext }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const program = programOrder;

  const validationResults = useMemo(
    () => validateProgram(level, program),
    [level, program]
  );

  const strengths = program.filter((e) => ratings[e.id] === "strength");
  const weaknesses = program.filter((e) => ratings[e.id] === "weakness");

  const lastIndex = program.length - 1;

  // Entry (index 0) and finale (last index) are locked
  const isDraggable = useCallback((index: number) => {
    return index > 0 && index < lastIndex;
  }, [lastIndex]);

  const isDropTarget = useCallback((index: number) => {
    return index > 0 && index < lastIndex;
  }, [lastIndex]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isDraggable(index)) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, [isDraggable]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isDropTarget(index)) {
      setDropIndex(index);
    }
  }, [isDropTarget]);

  const handleDragLeave = useCallback((index: number) => {
    setDropIndex((prev) => (prev === index ? null : prev));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && isDropTarget(toIndex) && dragIndex !== toIndex) {
      const newOrder = reorderExercises(program, dragIndex, toIndex);
      onReorder(newOrder.map((ex) => ex.id));
    }
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, isDropTarget, program, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {horseName ? `${horseName} - ` : ""}{level.displayName}
      </h2>
      <p className="text-gray-600 mb-1">
        Tid: {level.timeMin} - {level.timeMax} | Max score: {level.maxScore}
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Programmet er sorteret med styrker på fremtrædende pladser. Træk øvelser op/ned for at ændre rækkefølgen.
        {strengths.length > 0 && ` ${strengths.length} styrker placeret prominent.`}
        {weaknesses.length > 0 && ` ${weaknesses.length} svagheder minimeret.`}
      </p>

      <div className="mb-4">
        <ValidationBanner results={validationResults} />
      </div>

      {/* Program sequence */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Øvelse</span>
            <span className="col-span-2">Gangart</span>
            <span className="col-span-1 text-center">Koeff</span>
            <span className="col-span-1 text-center">Max</span>
            <span className="col-span-2 text-center">Vurdering</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {program.map((ex, i) => {
            const rating = ratings[ex.id] || "neutral";
            const canDrag = isDraggable(i);
            const isBeingDragged = dragIndex === i;
            const isOver = dropIndex === i && isDropTarget(i);
            return (
              <div
                key={ex.id}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragLeave={() => handleDragLeave(i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={`px-4 py-3 grid grid-cols-12 items-center text-sm transition-colors ${
                  isBeingDragged
                    ? "opacity-40"
                    : isOver
                    ? "border-2 border-blue-400 bg-blue-50"
                    : rating === "strength"
                    ? "bg-green-50"
                    : rating === "weakness"
                    ? "bg-red-50"
                    : ""
                } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <span className="col-span-1 flex items-center gap-1">
                  {canDrag && (
                    <span className="text-gray-300 text-xs select-none" title="Træk for at flytte">&#x2630;</span>
                  )}
                  <span className="text-gray-400 font-mono">{i + 1}</span>
                </span>
                <span className="col-span-5 font-medium text-gray-900">
                  {ex.name}
                  {ex.minDistance && (
                    <span className="text-xs text-gray-500 ml-1">({ex.minDistance})</span>
                  )}
                </span>
                <span className="col-span-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: GAIT_COLORS[ex.gait] }}
                  >
                    {GAIT_LABELS[ex.gait]}
                  </span>
                </span>
                <span className="col-span-1 text-center font-mono">
                  {ex.coefficient === 2 ? (
                    <span className="font-bold text-yellow-700">x2</span>
                  ) : (
                    <span className="text-gray-400">x1</span>
                  )}
                </span>
                <span className="col-span-1 text-center font-mono text-gray-600">
                  {10 * ex.coefficient}
                </span>
                <span className="col-span-2 text-center">
                  {rating === "strength" && (
                    <span className="text-green-700 font-medium">{"\u2191"} Styrke</span>
                  )}
                  {rating === "weakness" && (
                    <span className="text-red-700 font-medium">{"\u2193"} Svaghed</span>
                  )}
                  {rating === "neutral" && (
                    <span className="text-gray-400">Neutral</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Artistic marks */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm">
          Kunstnerisk bedømmelse
        </div>
        <div className="divide-y divide-gray-100">
          {level.artisticMarks.map((mark) => (
            <div key={mark.id} className="px-4 py-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-900">{mark.name}</span>
                <p className="text-xs text-gray-500">{mark.description}</p>
              </div>
              <span className="text-sm font-mono text-purple-700 font-bold">x{mark.coefficient}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Forbidden */}
      {level.forbidden.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 text-sm mb-2">Forbudte øvelser</h3>
          <ul className="space-y-1">
            {level.forbidden.map((f, i) => (
              <li key={i} className="text-sm text-red-700">
                <span className="font-medium">{f.description}</span> — {f.penalty}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Special rules */}
      {level.specialRules.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 text-sm mb-2">Særlige regler</h3>
          <ul className="space-y-1">
            {level.specialRules.map((rule, i) => (
              <li key={i} className="text-sm text-amber-700">{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          Tilbage
        </button>
        <div className="flex gap-3">
          {onNext && (
            <button
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Næste: Tegn bane
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
