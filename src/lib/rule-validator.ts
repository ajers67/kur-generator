import type { KurLevel, Exercise } from "@/data/kur-levels";

export interface ValidationResult {
  rule: string;
  severity: "error" | "warning";
  message: string;
  exerciseIds?: number[];
}

/** Check for obligatory exercises missing from the program (RULE-01, D-05) */
function checkMissingExercises(
  level: KurLevel,
  programOrder: Exercise[],
): ValidationResult[] {
  const programIds = new Set(programOrder.map((e) => e.id));
  const results: ValidationResult[] = [];

  for (const exercise of level.exercises) {
    if (!programIds.has(exercise.id)) {
      results.push({
        rule: "missing-exercise",
        severity: "error",
        message: `${exercise.name} mangler i programmet`,
        exerciseIds: [exercise.id],
      });
    }
  }

  return results;
}

/** Check for exercises not allowed at this level (RULE-03, D-07) */
function checkForbiddenExercises(
  level: KurLevel,
  programOrder: Exercise[],
): ValidationResult[] {
  const levelIds = new Set(level.exercises.map((e) => e.id));
  const results: ValidationResult[] = [];

  for (const exercise of programOrder) {
    if (!levelIds.has(exercise.id)) {
      results.push({
        rule: "forbidden-exercise",
        severity: "error",
        message: `${exercise.name} er ikke tilladt på dette niveau`,
        exerciseIds: [exercise.id],
      });
    }
  }

  return results;
}

/** Emit advisory warnings for exercises with minDistance (RULE-02, D-06) */
function checkMinDistance(
  programOrder: Exercise[],
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const exercise of programOrder) {
    if (exercise.minDistance) {
      results.push({
        rule: "min-distance",
        severity: "warning",
        message: `${exercise.name} skal dække ${exercise.minDistance}`,
        exerciseIds: [exercise.id],
      });
    }
  }

  return results;
}

/** Check that entry (Indridning) is first and finale is last (D-08) */
function checkEntryAndFinalePosition(
  level: KurLevel,
  programOrder: Exercise[],
): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (programOrder.length === 0) return results;

  // Find the entry exercise in the level
  const entryExercise = level.exercises.find((e) =>
    e.name.includes("Indridning"),
  );

  if (!entryExercise) return results;

  // Check entry is first
  if (programOrder[0].id !== entryExercise.id) {
    results.push({
      rule: "entry-position",
      severity: "error",
      message: "Indridning skal være første øvelse",
      exerciseIds: [entryExercise.id],
    });
  }

  // Check if there's a separate finale exercise (an overgang that's not the entry,
  // with "parade" or "afslutning" in the name)
  const finaleExercise = level.exercises.find(
    (e) =>
      e.id !== entryExercise.id &&
      e.gait === "overgang" &&
      (e.name.toLowerCase().includes("parade") ||
        e.name.toLowerCase().includes("afslutning")),
  );

  // If there's a separate finale, check it's last
  if (finaleExercise) {
    const lastExercise = programOrder[programOrder.length - 1];
    if (lastExercise.id !== finaleExercise.id) {
      results.push({
        rule: "finale-position",
        severity: "error",
        message: "Afslutningsparaden skal være sidste øvelse",
        exerciseIds: [finaleExercise.id],
      });
    }
  }

  return results;
}

/**
 * Validate a program against the rules for a given level.
 * Returns an empty array if the program is valid.
 *
 * Pure function — no React dependency.
 */
export function validateProgram(
  level: KurLevel,
  programOrder: Exercise[],
): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(...checkMissingExercises(level, programOrder));
  results.push(...checkForbiddenExercises(level, programOrder));
  results.push(...checkMinDistance(programOrder));
  results.push(...checkEntryAndFinalePosition(level, programOrder));

  return results;
}
