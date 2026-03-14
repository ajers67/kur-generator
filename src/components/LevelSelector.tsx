import type { KurLevel } from "@/data/kur-levels";
import { GAIT_LABELS } from "@/data/kur-levels";

interface Props {
  levels: KurLevel[];
  onSelect: (level: KurLevel) => void;
}

export function LevelSelector({ levels, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Vælg niveau</h2>
      <p className="text-gray-600 mb-6">
        Vælg det niveau din kür skal rides på. Hvert niveau har forskellige obligatoriske øvelser.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {levels.map((level) => {
          const gaits = [...new Set(level.exercises.map((e) => e.gait))];
          const coeff2Count = level.exercises.filter((e) => e.coefficient === 2).length;

          return (
            <button
              key={level.id}
              onClick={() => onSelect(level)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-lg text-gray-900">{level.displayName}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Tid: {level.timeMin} - {level.timeMax}</p>
                <p>{level.exercises.length} obligatoriske øvelser</p>
                {coeff2Count > 0 && (
                  <p className="text-blue-700 font-medium">
                    {coeff2Count} dobbelt-koefficient øvelser
                  </p>
                )}
                {level.minAge && <p className="text-gray-500">{level.minAge}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {gaits.map((gait) => (
                  <span
                    key={gait}
                    className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {GAIT_LABELS[gait]}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
