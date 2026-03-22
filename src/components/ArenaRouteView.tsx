"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Exercise, Gait } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";
import { generateRoutes } from "@/lib/route-generator";
import type { ArenaRoute } from "@/lib/route-generator";
import { ArenaCanvas } from "./ArenaCanvas";
import type { ArenaPath, PathPoint } from "./ArenaCanvas";

interface Props {
  programOrder: Exercise[];
  ratings: Record<number, StrengthRating>;
  onRoutesGenerated: (paths: ArenaPath[]) => void;
}

export function ArenaRouteView({ programOrder, ratings, onRoutesGenerated }: Props) {
  const [seed, setSeed] = useState(() => Date.now());
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  // Track user-moved route positions (overrides generated positions)
  const [movedPaths, setMovedPaths] = useState<Map<number, PathPoint[]>>(new Map());

  const routes: ArenaRoute[] = useMemo(() => {
    if (programOrder.length === 0) return [];
    return generateRoutes(programOrder, ratings, { seed });
  }, [programOrder, ratings, seed]);

  // Convert ArenaRoute[] to ArenaPath[] (drop rating field), applying user-moved positions
  const arenaPaths: ArenaPath[] = useMemo(() => {
    return routes.map((r, i) => ({
      points: movedPaths.get(i) || r.points,
      gait: r.gait,
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
    }));
  }, [routes, movedPaths]);

  // Persist generated/moved routes to wizard store
  const onRoutesGeneratedCb = useCallback(onRoutesGenerated, [onRoutesGenerated]);
  useEffect(() => {
    if (arenaPaths.length > 0) {
      onRoutesGeneratedCb(arenaPaths);
    }
  }, [arenaPaths, onRoutesGeneratedCb]);

  // Compute labels at midpoints (using effective/moved positions)
  const labels = useMemo(() => {
    return arenaPaths.map((path, i) => {
      const midIdx = Math.floor(path.points.length / 2);
      const point = path.points[midIdx] || path.points[0];
      const name = path.exerciseName.length > 15
        ? path.exerciseName.slice(0, 14) + "\u2026"
        : path.exerciseName;
      return {
        exerciseId: path.exerciseId,
        label: `${i + 1}. ${name}`,
        point,
      };
    });
  }, [arenaPaths]);

  // Compute transition lines between consecutive routes (using effective/moved positions)
  const transitions = useMemo(() => {
    const result: { from: PathPoint; to: PathPoint }[] = [];
    for (let i = 0; i < arenaPaths.length - 1; i++) {
      const current = arenaPaths[i];
      const next = arenaPaths[i + 1];
      if (current.points.length > 0 && next.points.length > 0) {
        result.push({
          from: current.points[current.points.length - 1],
          to: next.points[0],
        });
      }
    }
    return result;
  }, [arenaPaths]);

  const handleRegenerate = useCallback(() => {
    setSeed(Date.now());
    setMovedPaths(new Map());
    setSelectedRouteIndex(null);
  }, []);

  // Handle route move — update movedPaths with new positions
  const handleRouteMove = useCallback((index: number, newPoints: PathPoint[]) => {
    setMovedPaths((prev) => {
      const next = new Map(prev);
      next.set(index, newPoints);
      return next;
    });
  }, []);

  // Clear selection when programOrder changes
  useEffect(() => {
    setSelectedRouteIndex(null);
    setMovedPaths(new Map());
  }, [programOrder]);

  // Get active gaits for legend
  const activeGaits = useMemo(() => {
    const gaits = new Set<Gait>();
    for (const ex of programOrder) {
      gaits.add(ex.gait);
    }
    return Array.from(gaits);
  }, [programOrder]);

  // Get selected exercise name for info bar
  const selectedExerciseName = selectedRouteIndex !== null && selectedRouteIndex < arenaPaths.length
    ? arenaPaths[selectedRouteIndex].exerciseName
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Arena */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Bane (20x60m)</h3>
          </div>
          {/* Selected route info bar */}
          {selectedExerciseName && (
            <div className="mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
              <span className="font-medium">{selectedExerciseName}</span>
              <span className="text-blue-500 text-xs">- tryk og traek for at flytte</span>
            </div>
          )}
          <ArenaCanvas
            width={300}
            height={450}
            paths={arenaPaths}
            labels={labels}
            transitions={transitions}
            selectedRouteIndex={selectedRouteIndex}
            onRouteSelect={setSelectedRouteIndex}
            onRouteMove={handleRouteMove}
          />
          {/* Gait legend */}
          <div className="flex gap-3 mt-3 text-xs">
            {activeGaits.map((gait) => (
              <div key={gait} className="flex items-center gap-1">
                <div
                  className="w-4 h-0.5 rounded"
                  style={{
                    backgroundColor: GAIT_COLORS[gait],
                    borderBottom: gait === "skridt" ? "2px dashed " + GAIT_COLORS[gait] : "2px solid " + GAIT_COLORS[gait],
                  }}
                />
                <span>{GAIT_LABELS[gait]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise list (read-only, informational) */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Program i banen
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Klik pa en rute i banen for at markere den. Traek den valgte rute for at flytte den.
          </p>

          <div className="space-y-1">
            {programOrder.map((ex, i) => {
              const rating = ratings[ex.id] || "neutral";
              const isSelected = i === selectedRouteIndex;

              return (
                <div
                  key={ex.id}
                  onClick={() => setSelectedRouteIndex(i === selectedRouteIndex ? null : i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-2 border-blue-400"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: GAIT_COLORS[ex.gait] }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    {ex.name}
                  </span>
                  {ex.coefficient === 2 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                      x2
                    </span>
                  )}
                  {rating === "strength" && (
                    <span className="text-green-600 text-xs">{"\u2191"}</span>
                  )}
                  {rating === "weakness" && (
                    <span className="text-red-600 text-xs">{"\u2193"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
