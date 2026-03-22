import type { KurLevel, Exercise } from "@/data/kur-levels";

export interface ValidationResult {
  rule: string;
  severity: "error" | "warning";
  message: string;
  exerciseIds?: number[];
}

export function validateProgram(
  level: KurLevel,
  programOrder: Exercise[],
): ValidationResult[] {
  return [];
}
