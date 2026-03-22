import type { ValidationResult } from "@/lib/rule-validator";

interface Props {
  results: ValidationResult[];
}

export function ValidationBanner({ results }: Props) {
  const errors = results.filter((r) => r.severity === "error");
  const warnings = results.filter((r) => r.severity === "warning");

  if (results.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
        <span className="text-green-600 text-lg">&#10003;</span>
        <span className="text-sm font-medium text-green-800">
          Programmet overholder reglerne
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <details className="bg-red-50 border border-red-200 rounded-xl p-4" open>
          <summary className="flex items-center gap-2 cursor-pointer">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
              {errors.length} {errors.length === 1 ? "fejl" : "fejl"}
            </span>
            <span className="text-sm font-medium text-red-800">
              Regelovertr&#230;delser fundet
            </span>
          </summary>
          <ul className="mt-2 space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-700">
                {err.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      {warnings.length > 0 && (
        <details className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <summary className="flex items-center gap-2 cursor-pointer">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              {warnings.length} {warnings.length === 1 ? "advarsel" : "advarsler"}
            </span>
            <span className="text-sm font-medium text-amber-800">
              Bem&#230;rkninger til programmet
            </span>
          </summary>
          <ul className="mt-2 space-y-1">
            {warnings.map((warn, i) => (
              <li key={i} className="text-sm text-amber-700">
                {warn.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
