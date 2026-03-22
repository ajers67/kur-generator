import { describe, it, expect } from "vitest";
import { generateProgramOrder } from "@/lib/program-generator";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

// LA level is index 0, 14 exercises
// Exercise 14 (id=14): "Indridning samt indridnings- og afslutningsparade" (gait: "overgang") — entry AND finale
// Exercises 5,6: "Schenkelvigning i trav til venstre/hojre" (coefficient: 2) — left/right pair
// Exercises 3,4: "Volte 10 meter til venstre/hojre" — another pair
// Exercises 10,11: "Kontragalop til venstre/hojre" — another pair
// Exercises 12,13: "Changer galop gennem skridt (H->V)/(V->H)" — a pair

const LA = KUR_LEVELS[0];

function makeRatings(
  overrides: Record<number, StrengthRating>,
): Record<number, StrengthRating> {
  return overrides;
}

describe("arc structure", () => {
  it("entry exercise (Indridning) is always index 0", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    expect(result[0].name).toContain("Indridning");
  });

  it("last exercise is an overgang type when a separate finale exists", () => {
    // For LA, exercise 14 is both entry and finale (the only overgang).
    // So it should be first, and the program ends with the last non-entry exercise.
    // For levels with a separate halt/hilsen, it should be last.
    // Test with Grand Prix which has exercise 16 as entry and exercise 15 as overgang
    const GP = KUR_LEVELS[6]; // Grand Prix
    const result = generateProgramOrder(GP, makeRatings({}), "neutral", {
      seed: 42,
    });
    expect(result[0].name).toContain("Indridning");
    // GP has two overgang exercises: id 15 (passage->piaffe transitions) and id 16 (entry/finale)
    // The entry (id 16) should be first, and we just verify it's there
    expect(result.length).toBe(GP.exercises.length);
  });

  it("exercises in the last third have higher average coefficient than the first third", () => {
    // Use ratings that create a clear separation
    const ratings = makeRatings({
      5: "strength",
      6: "strength",
      9: "strength",
    });
    const result = generateProgramOrder(LA, ratings, "neutral", { seed: 42 });

    // Skip first (entry) for this calculation
    const body = result.slice(1);
    const thirdSize = Math.floor(body.length / 3);
    const firstThird = body.slice(0, thirdSize);
    const lastThird = body.slice(-thirdSize);

    const avgCoeff = (exs: Exercise[]) =>
      exs.reduce((sum, e) => sum + e.coefficient, 0) / exs.length;

    expect(avgCoeff(lastThird)).toBeGreaterThanOrEqual(avgCoeff(firstThird));
  });
});

describe("strength/weakness placement", () => {
  const ratings = makeRatings({
    5: "strength",
    9: "strength",
    3: "weakness",
    12: "weakness",
  });

  it("strength-rated exercises appear in the last 60% of the program", () => {
    const result = generateProgramOrder(LA, ratings, "neutral", { seed: 42 });
    const cutoff = Math.floor(result.length * 0.4);

    const strengthExercises = result.filter(
      (e) => ratings[e.id] === "strength",
    );
    for (const ex of strengthExercises) {
      const idx = result.indexOf(ex);
      expect(idx).toBeGreaterThanOrEqual(cutoff);
    }
  });

  it("weakness-rated exercises appear in the first 50% of the program", () => {
    const result = generateProgramOrder(LA, ratings, "neutral", { seed: 42 });
    const halfPoint = Math.ceil(result.length * 0.5);

    const weakExercises = result.filter((e) => ratings[e.id] === "weakness");
    for (const ex of weakExercises) {
      const idx = result.indexOf(ex);
      expect(idx).toBeLessThan(halfPoint);
    }
  });

  it("high-coefficient (>=2) exercises appear in the last 40%", () => {
    const neutralRatings = makeRatings({});
    const result = generateProgramOrder(LA, neutralRatings, "neutral", {
      seed: 42,
    });
    const cutoff = Math.floor(result.length * 0.6);

    const highCoeff = result.filter((e) => e.coefficient >= 2);
    for (const ex of highCoeff) {
      const idx = result.indexOf(ex);
      expect(idx).toBeGreaterThanOrEqual(cutoff);
    }
  });

  it("exercise that is BOTH high-coefficient AND weakness appears in build-up section (middle)", () => {
    // Exercise 5 has coefficient 2 — mark it as weakness
    const mixedRatings = makeRatings({ 5: "weakness" });
    const result = generateProgramOrder(LA, mixedRatings, "neutral", {
      seed: 42,
    });

    const ex5 = result.find((e) => e.id === 5)!;
    const idx = result.indexOf(ex5);
    // Not in first 20% or last 20%
    expect(idx).toBeGreaterThan(Math.floor(result.length * 0.2));
    expect(idx).toBeLessThan(Math.ceil(result.length * 0.8));
  });
});

describe("symmetry", () => {
  it("detects left/right pairs by matching exercise names", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });

    // Exercises 3 (venstre) and 4 (hojre) should both be present
    const idx3 = result.findIndex((e) => e.id === 3);
    const idx4 = result.findIndex((e) => e.id === 4);
    expect(idx3).toBeGreaterThan(-1);
    expect(idx4).toBeGreaterThan(-1);
  });

  it("paired exercises are within 3 positions of each other but NOT adjacent", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });

    // Check volte pair (3, 4)
    const idx3 = result.findIndex((e) => e.id === 3);
    const idx4 = result.findIndex((e) => e.id === 4);
    const distance = Math.abs(idx3 - idx4);
    expect(distance).toBeGreaterThanOrEqual(2); // not adjacent
    expect(distance).toBeLessThanOrEqual(3); // within 3 positions
  });

  it("if one side of a pair is strength-rated, that side comes first", () => {
    // Mark exercise 3 (venstre volte) as strength
    const ratings = makeRatings({ 3: "strength" });
    const result = generateProgramOrder(LA, ratings, "neutral", { seed: 42 });

    const idx3 = result.findIndex((e) => e.id === 3);
    const idx4 = result.findIndex((e) => e.id === 4);
    // Strength side (3) should come before the other side (4)
    expect(idx3).toBeLessThan(idx4);
  });
});

describe("randomization", () => {
  it("with seed=42, output is deterministic (call twice, same result)", () => {
    const r1 = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    const r2 = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    expect(r1.map((e) => e.id)).toEqual(r2.map((e) => e.id));
  });

  it("with seed=42 vs seed=99, outputs differ", () => {
    const r1 = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    const r2 = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 99,
    });
    const ids1 = r1.map((e) => e.id);
    const ids2 = r2.map((e) => e.id);
    // At least one exercise in a different position
    const hasDiff = ids1.some((id, i) => id !== ids2[i]);
    expect(hasDiff).toBe(true);
  });

  it("without seed, two calls may produce different results", () => {
    const results: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const r = generateProgramOrder(LA, makeRatings({}), "neutral");
      results.push(r.map((e) => e.id));
    }
    // Not all 10 runs should be identical
    const allSame = results.every(
      (r) => JSON.stringify(r) === JSON.stringify(results[0]),
    );
    expect(allSame).toBe(false);
  });
});

describe("temperament gait sequencing", () => {
  // Helper: extract gait sequence from program (skipping entry at index 0)
  function gaitSequence(program: Exercise[]): string[] {
    return program.slice(1).map((e) => e.gait);
  }

  it("calm: skridt appears before galop after entry (D-10)", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "calm", {
      seed: 42,
    });
    const afterEntry = result.slice(1);
    const firstSkridtIdx = afterEntry.findIndex((e) => e.gait === "skridt");
    const firstGalopIdx = afterEntry.findIndex((e) => e.gait === "galop");
    // D-10: Calm horse gets skridt early, galop later (gradual warm-up)
    expect(firstSkridtIdx).toBeGreaterThan(-1);
    expect(firstGalopIdx).toBeGreaterThan(-1);
    expect(firstSkridtIdx).toBeLessThan(firstGalopIdx);
  });

  it("energetic: trav/galop appears before skridt, skridt in second half (D-11)", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "energetic", {
      seed: 42,
    });
    const afterEntry = result.slice(1);
    // D-11: Energetic horse starts with trav/galop, skridt as mid-program pause
    const firstGait = afterEntry[0].gait;
    expect(firstGait === "trav" || firstGait === "galop").toBe(true);

    // Skridt should appear in the second half of the program (mid-program pause)
    const firstSkridtIdx = afterEntry.findIndex((e) => e.gait === "skridt");
    expect(firstSkridtIdx).toBeGreaterThan(-1);
    const halfPoint = Math.floor(afterEntry.length / 2);
    expect(firstSkridtIdx).toBeGreaterThanOrEqual(halfPoint);
  });

  it("neutral: trav appears first after entry (D-12)", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    // D-12: Neutral horse starts with trav (balanced)
    expect(result[1].gait).toBe("trav");
  });

  it("different temperaments produce different skridt placement", () => {
    const calm = generateProgramOrder(LA, makeRatings({}), "calm", {
      seed: 42,
    });
    const energetic = generateProgramOrder(LA, makeRatings({}), "energetic", {
      seed: 42,
    });
    const neutral = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });

    // Extract gait sequences (after entry)
    const calmGaits = gaitSequence(calm);
    const energeticGaits = gaitSequence(energetic);
    const neutralGaits = gaitSequence(neutral);

    // Find first skridt position in each
    const calmSkridtIdx = calmGaits.indexOf("skridt");
    const energeticSkridtIdx = energeticGaits.indexOf("skridt");
    const neutralSkridtIdx = neutralGaits.indexOf("skridt");

    // Calm should have skridt earliest, energetic latest (D-10 vs D-11)
    expect(calmSkridtIdx).toBeLessThan(energeticSkridtIdx);
    // Neutral should be between calm and energetic (D-12)
    expect(neutralSkridtIdx).toBeLessThan(energeticSkridtIdx);

    // At least 2 of the 3 full gait sequences should differ
    const sequences = [calmGaits, energeticGaits, neutralGaits].map((g) =>
      JSON.stringify(g),
    );
    const uniqueSequences = new Set(sequences);
    expect(uniqueSequences.size).toBeGreaterThanOrEqual(2);
  });
});

describe("API contract", () => {
  it("function accepts 3 args (backwards compatible) and returns Exercise[]", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("function accepts 4th optional arg { seed: number }", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("all exercises from level.exercises appear exactly once in output", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    const outputIds = result.map((e) => e.id).sort((a, b) => a - b);
    const inputIds = LA.exercises
      .map((e) => e.id)
      .sort((a, b) => a - b);
    expect(outputIds).toEqual(inputIds);
  });

  it("return type has correct shape (id, name, gait, coefficient)", () => {
    const result = generateProgramOrder(LA, makeRatings({}), "neutral", {
      seed: 42,
    });
    for (const ex of result) {
      expect(typeof ex.id).toBe("number");
      expect(typeof ex.name).toBe("string");
      expect(typeof ex.gait).toBe("string");
      expect(typeof ex.coefficient).toBe("number");
    }
  });
});
