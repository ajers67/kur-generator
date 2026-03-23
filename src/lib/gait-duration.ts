import type { KurLevel, Exercise } from "@/data/kur-levels";

export interface GaitDuration {
  gait: string;
  durationSec: number;
  exerciseCount: number;
  totalCoefficient: number;
}

/**
 * Calculate duration per gait based on program exercises and level time limits.
 * Uses coefficient-weighted distribution: higher coefficient = more time.
 */
export function calculateGaitDurations(
  level: KurLevel,
  programOrder: Exercise[],
): GaitDuration[] {
  // Parse total duration from level (use midpoint of min-max)
  const minSec = parseTimeToSeconds(level.timeMin);
  const maxSec = parseTimeToSeconds(level.timeMax);
  const totalSec = (minSec + maxSec) / 2;

  // Group exercises by gait, sum coefficients
  const gaitMap = new Map<string, { count: number; totalCoeff: number }>();

  for (const ex of programOrder) {
    if (ex.gait === "overgang") continue; // Transitions don't get their own music
    const existing = gaitMap.get(ex.gait) || { count: 0, totalCoeff: 0 };
    existing.count++;
    existing.totalCoeff += ex.coefficient;
    gaitMap.set(ex.gait, existing);
  }

  // Calculate total weight
  const totalWeight = Array.from(gaitMap.values()).reduce(
    (sum, g) => sum + g.totalCoeff,
    0,
  );

  if (totalWeight === 0) return [];

  // Distribute time proportionally
  const durations: GaitDuration[] = [];
  for (const [gait, { count, totalCoeff }] of gaitMap) {
    durations.push({
      gait,
      durationSec: Math.round((totalCoeff / totalWeight) * totalSec),
      exerciseCount: count,
      totalCoefficient: totalCoeff,
    });
  }

  return durations;
}

/**
 * Estimate max lyrics characters for a given duration.
 * ~3 words per second for sung lyrics, ~5 chars per word.
 */
export function maxLyricsForDuration(durationSec: number): number {
  const wordsPerSecond = 2.5; // Conservative — sung lyrics are slower than speech
  const charsPerWord = 5.5; // Average Danish/English word length + space
  return Math.round(durationSec * wordsPerSecond * charsPerWord);
}

function parseTimeToSeconds(time: string): number {
  const [min, sec] = time.split(":").map(Number);
  return (min || 0) * 60 + (sec || 0);
}
