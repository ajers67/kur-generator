import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";

interface Props {
  level: KurLevel;
  ratings: Record<number, StrengthRating>;
  onRatingChange: (id: number, rating: StrengthRating) => void;
  onNext: () => void;
  onBack: () => void;
}

const RATING_OPTIONS: { value: StrengthRating; label: string; icon: string; color: string }[] = [
  { value: "strength", label: "Styrke", icon: "\u2191", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "neutral", label: "Neutral", icon: "\u2194", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "weakness", label: "Svaghed", icon: "\u2193", color: "bg-red-100 text-red-800 border-red-300" },
];

export function ExerciseList({ level, ratings, onRatingChange, onNext, onBack }: Props) {
  const groupedByGait = level.exercises.reduce(
    (acc, ex) => {
      if (!acc[ex.gait]) acc[ex.gait] = [];
      acc[ex.gait].push(ex);
      return acc;
    },
    {} as Record<string, typeof level.exercises>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {level.displayName} - Styrker og svagheder
      </h2>
      <p className="text-gray-600 mb-6">
        Marker hver øvelse som styrke, neutral eller svaghed. Styrker placeres prominently i programmet,
        svagheder minimeres.
      </p>

      <div className="space-y-6">
        {Object.entries(groupedByGait).map(([gait, exercises]) => (
          <div key={gait} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className="px-4 py-2 font-semibold text-white text-sm"
              style={{ backgroundColor: GAIT_COLORS[gait as keyof typeof GAIT_COLORS] }}
            >
              {GAIT_LABELS[gait as keyof typeof GAIT_LABELS]}
            </div>
            <div className="divide-y divide-gray-100">
              {exercises.map((ex) => (
                <div key={ex.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{ex.name}</span>
                      {ex.coefficient === 2 && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                          x2
                        </span>
                      )}
                    </div>
                    {ex.minDistance && (
                      <span className="text-xs text-gray-500">{ex.minDistance}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {RATING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onRatingChange(ex.id, opt.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                          (ratings[ex.id] || "neutral") === opt.value
                            ? `${opt.color} border-2`
                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                        }`}
                        title={opt.label}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Forbidden movements */}
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
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generer program
        </button>
      </div>
    </div>
  );
}
