import type { KurLevel, Exercise, Gait } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

interface GeneratorOptions {
  seed?: number;
}

// Seeded PRNG (mulberry32) — returns a function producing floats 0-1
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle — returns a new array
function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Normalize exercise name for pair detection
function normalizeName(name: string): string {
  return name
    .replace(/til venstre/gi, "")
    .replace(/til højre/gi, "")
    .replace(/til hoejre/gi, "")
    .replace(/til hojre/gi, "")
    .replace(/\(H→V\)/g, "")
    .replace(/\(V→H\)/g, "")
    .replace(/\(H->V\)/g, "")
    .replace(/\(V->H\)/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

// Detect left/right exercise pairs
function detectPairs(exercises: Exercise[]): [Exercise, Exercise][] {
  const pairs: [Exercise, Exercise][] = [];
  const used = new Set<number>();

  for (let i = 0; i < exercises.length; i++) {
    if (used.has(exercises[i].id)) continue;
    const normI = normalizeName(exercises[i].name);

    for (let j = i + 1; j < exercises.length; j++) {
      if (used.has(exercises[j].id)) continue;
      const normJ = normalizeName(exercises[j].name);

      if (normI === normJ && exercises[i].name !== exercises[j].name) {
        pairs.push([exercises[i], exercises[j]]);
        used.add(exercises[i].id);
        used.add(exercises[j].id);
        break;
      }
    }
  }

  return pairs;
}

// Score an exercise for placement priority
// Higher score = more prominent placement (climax)
function scoreExercise(
  exercise: Exercise,
  rating: StrengthRating,
  coefficient: number,
): number {
  const ratingScore: Record<StrengthRating, number> = {
    strength: 3,
    neutral: 1,
    weakness: 0,
  };

  const base = ratingScore[rating] * 2 + coefficient * 3;

  // D-09: high-coefficient AND weakness = cap at midrange
  if (coefficient >= 2 && rating === "weakness") {
    return 4;
  }

  return base;
}

// Gait ordering by temperament
function getGaitOrder(
  temperament: "calm" | "neutral" | "energetic",
): Gait[] {
  switch (temperament) {
    case "calm":
      return ["skridt", "trav", "galop"];
    case "energetic":
      return ["trav", "galop", "skridt", "galop"];
    case "neutral":
      return ["trav", "skridt", "galop"];
  }
}

export function generateProgramOrder(
  level: KurLevel,
  ratings: Record<number, StrengthRating>,
  temperament: "calm" | "neutral" | "energetic",
  options?: GeneratorOptions,
): Exercise[] {
  const rng =
    options?.seed !== undefined
      ? mulberry32(options.seed)
      : () => Math.random();

  const allExercises = [...level.exercises];

  // Extract entry exercise
  const entryExercise = allExercises.find((e) => e.name.includes("Indridning"));
  if (!entryExercise) {
    // Fallback: just shuffle everything
    return fisherYatesShuffle(allExercises, rng);
  }

  // Remove entry from pool
  let pool = allExercises.filter((e) => e.id !== entryExercise.id);

  // Check if there's a separate finale (another overgang that's not the entry)
  // For LA, entry IS also the finale (only 1 overgang exercise)
  const separateFinale = pool.find(
    (e) =>
      e.gait === "overgang" &&
      !e.name.includes("Indridning") &&
      (e.name.toLowerCase().includes("parade") ||
        e.name.toLowerCase().includes("halt")),
  );

  // Don't extract separate finale from pool — overgang exercises that aren't
  // entry/finale should flow normally through the algorithm

  // Score all pool exercises
  const scored = pool.map((e) => ({
    exercise: e,
    rating: ratings[e.id] || ("neutral" as StrengthRating),
    score: scoreExercise(e, ratings[e.id] || "neutral", e.coefficient),
  }));

  // Separate passage/piaffe for climax forcing (D-13)
  const passagePiaffe = scored.filter(
    (s) => s.exercise.gait === "passage" || s.exercise.gait === "piaffe",
  );
  const regularExercises = scored.filter(
    (s) => s.exercise.gait !== "passage" && s.exercise.gait !== "piaffe",
  );

  // Group by gait
  const gaitGroups: Record<string, typeof scored> = {};
  for (const s of regularExercises) {
    const gait = s.exercise.gait;
    if (!gaitGroups[gait]) gaitGroups[gait] = [];
    gaitGroups[gait].push(s);
  }

  // Sort within each gait group by score
  for (const gait of Object.keys(gaitGroups)) {
    gaitGroups[gait].sort((a, b) => a.score - b.score);
  }

  // Build ordered pool following temperament-based gait sequence
  const gaitOrder = getGaitOrder(temperament);
  const orderedPool: typeof scored = [];
  const usedGaitItems = new Set<number>();

  for (const gait of gaitOrder) {
    const group = gaitGroups[gait] || [];
    if (gait === "galop" && temperament === "energetic") {
      // For energetic: split galop — first half early, second half after skridt
      const unused = group.filter((s) => !usedGaitItems.has(s.exercise.id));
      const half = Math.ceil(unused.length / 2);
      const toAdd = unused.slice(0, half);
      for (const s of toAdd) {
        orderedPool.push(s);
        usedGaitItems.add(s.exercise.id);
      }
    } else {
      const unused = group.filter((s) => !usedGaitItems.has(s.exercise.id));
      for (const s of unused) {
        orderedPool.push(s);
        usedGaitItems.add(s.exercise.id);
      }
    }
  }

  // Add any remaining exercises (overgang etc.) not yet in the ordered pool
  for (const s of regularExercises) {
    if (!usedGaitItems.has(s.exercise.id)) {
      orderedPool.push(s);
      usedGaitItems.add(s.exercise.id);
    }
  }

  // Divide into arc sections (D-01)
  // Build-up: first ~50% — weakness exercises, moderate scores
  // Climax: last ~40% — strength + high-coefficient (D-03: climax in last third)
  // Wind-down: ~10% — buffer between climax and end
  const N = orderedPool.length;
  const windDownSize = Math.max(1, Math.round(N * 0.10));
  const climaxSize = Math.round(N * 0.40);
  const buildUpSize = N - climaxSize - windDownSize;

  // Sort entire pool by score to assign to sections
  // Build-up gets lowest scores (weakness exercises go here — D-07)
  // Climax gets highest scores (strength + high-coefficient — D-06, D-08)
  // Wind-down gets moderate scores
  const sortedByScore = [...orderedPool].sort((a, b) => a.score - b.score);

  // Build-up: lowest scores (weakness exercises land here)
  const buildUpItems = sortedByScore.slice(0, buildUpSize);
  // Wind-down: moderate scores
  const windDownItems = sortedByScore.slice(
    buildUpSize,
    buildUpSize + windDownSize,
  );
  // Climax: highest scores (strength + high-coefficient)
  const climaxItems = sortedByScore.slice(buildUpSize + windDownSize);

  // Force passage/piaffe into climax (D-13)
  for (const pp of passagePiaffe) {
    climaxItems.push(pp);
  }

  // Shuffle within each section (D-17)
  const shuffledBuildUp = fisherYatesShuffle(
    buildUpItems.map((s) => s.exercise),
    rng,
  );
  const shuffledClimax = fisherYatesShuffle(
    climaxItems.map((s) => s.exercise),
    rng,
  );
  const shuffledWindDown = fisherYatesShuffle(
    windDownItems.map((s) => s.exercise),
    rng,
  );

  // Assemble: entry + build-up + climax + wind-down (+ separate finale if exists)
  let program = [
    entryExercise,
    ...shuffledBuildUp,
    ...shuffledClimax,
    ...shuffledWindDown,
  ];

  // Handle symmetry pairs (D-14, D-15, D-16)
  const pairs = detectPairs(pool);

  for (const [a, b] of pairs) {
    const idxA = program.findIndex((e) => e.id === a.id);
    const idxB = program.findIndex((e) => e.id === b.id);
    if (idxA === -1 || idxB === -1) continue;

    // Determine which should come first (D-16: strength side first)
    const ratingA = ratings[a.id] || "neutral";
    const ratingB = ratings[b.id] || "neutral";
    let firstIdx = Math.min(idxA, idxB);
    let secondIdx = Math.max(idxA, idxB);
    let firstEx = program[firstIdx];
    let secondEx = program[secondIdx];

    // If the second exercise is the strength-rated one, swap
    if (
      ratingB === "strength" &&
      ratingA !== "strength" &&
      program[firstIdx].id === a.id
    ) {
      // b should come first, so we need to swap their positions
      firstEx = b;
      secondEx = a;
    } else if (
      ratingA === "strength" &&
      ratingB !== "strength" &&
      program[firstIdx].id === b.id
    ) {
      firstEx = a;
      secondEx = b;
    }

    const distance = secondIdx - firstIdx;

    if (distance < 2 || distance > 3) {
      // Need to adjust: remove both, reinsert with proper spacing
      // Remove from program (remove higher index first to preserve lower index)
      program = program.filter(
        (e) => e.id !== firstEx.id && e.id !== secondEx.id,
      );

      // Find a good insertion point for the first exercise
      // Keep it roughly where it was, but ensure within bounds
      let insertAt = Math.max(1, Math.min(firstIdx, program.length));

      // Insert first exercise
      program.splice(insertAt, 0, firstEx);
      // Insert second exercise 2 positions later
      const secondInsertAt = Math.min(insertAt + 2, program.length);
      program.splice(secondInsertAt, 0, secondEx);
    } else {
      // Distance is 2 or 3 — check order
      if (program[firstIdx].id !== firstEx.id) {
        // Swap them in-place
        program[firstIdx] = firstEx;
        program[secondIdx] = secondEx;
      }
    }
  }

  // Deduplicate (safety net)
  const seen = new Set<number>();
  program = program.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Verify all exercises are present — add any missing ones
  const programIds = new Set(program.map((e) => e.id));
  for (const e of allExercises) {
    if (!programIds.has(e.id)) {
      // Insert before the last position
      program.splice(program.length - 1, 0, e);
    }
  }

  return program;
}
