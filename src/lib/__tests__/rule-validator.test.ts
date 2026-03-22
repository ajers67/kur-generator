import { describe, it, expect } from "vitest";
import { validateProgram } from "@/lib/rule-validator";
import type { ValidationResult } from "@/lib/rule-validator";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { KurLevel, Exercise } from "@/data/kur-levels";

// LA level: index 0, 14 exercises, entry is id=14 "Indridning samt indridnings- og afslutningsparade"
const LA = KUR_LEVELS[0];
// LA6 level: index 1, 15 exercises, entry is id=15
const LA6 = KUR_LEVELS[1];
// Grand Prix: index 6, forbidden=[]
const GP = KUR_LEVELS[6];

// Helper: build a valid LA program (entry first, all exercises)
function validLAProgram(): Exercise[] {
  const entry = LA.exercises.find((e) => e.id === 14)!;
  const rest = LA.exercises.filter((e) => e.id !== 14);
  return [entry, ...rest];
}

// Helper: build a valid LA6 program (entry first, all exercises)
function validLA6Program(): Exercise[] {
  const entry = LA6.exercises.find((e) => e.id === 15)!;
  const rest = LA6.exercises.filter((e) => e.id !== 15);
  return [entry, ...rest];
}

// Helper: build a valid GP program (entry first, all exercises)
function validGPProgram(): Exercise[] {
  const entry = GP.exercises.find((e) => e.id === 16)!;
  const rest = GP.exercises.filter((e) => e.id !== 16);
  return [entry, ...rest];
}

describe("rule-validator", () => {
  describe("valid programs", () => {
    it("returns no errors for valid LA program with all exercises present, entry first", () => {
      const program = validLAProgram();
      const results = validateProgram(LA, program);
      const errors = results.filter((r) => r.severity === "error");
      expect(errors).toEqual([]);
    });

    it("only produces advisory warnings (not errors) for a fully valid program", () => {
      const program = validLAProgram();
      const results = validateProgram(LA, program);
      expect(results.every((r) => r.severity === "warning")).toBe(true);
    });
  });

  describe("RULE-01: missing obligatory exercises", () => {
    it("detects missing obligatory exercise (Middelskridt)", () => {
      const program = validLAProgram().filter((e) => e.id !== 1);
      const results = validateProgram(LA, program);

      const missing = results.filter((r) => r.rule === "missing-exercise");
      expect(missing.length).toBeGreaterThanOrEqual(1);
      expect(missing[0].severity).toBe("error");
      expect(missing[0].message).toContain("Middelskridt");
      expect(missing[0].message).toContain("mangler");
    });

    it("detects multiple missing exercises", () => {
      // Remove id=1 (Middelskridt) and id=7 (Middeltrav)
      const program = validLAProgram().filter(
        (e) => e.id !== 1 && e.id !== 7,
      );
      const results = validateProgram(LA, program);

      const missing = results.filter((r) => r.rule === "missing-exercise");
      expect(missing).toHaveLength(2);
      expect(missing.every((r) => r.severity === "error")).toBe(true);

      const messages = missing.map((r) => r.message).join(" ");
      expect(messages).toContain("Middelskridt");
      expect(messages).toContain("Middeltrav");
    });
  });

  describe("RULE-02: lateral movement minimum distance", () => {
    it("warns about lateral movement minimum distance", () => {
      const program = validLA6Program();
      const results = validateProgram(LA6, program);

      const distanceWarnings = results.filter(
        (r) => r.rule === "min-distance",
      );
      // LA6 has exercises with minDistance: "min. 20 meter" and "min. 12 meter"
      expect(distanceWarnings.length).toBeGreaterThan(0);
      expect(distanceWarnings.every((r) => r.severity === "warning")).toBe(true);

      // Check at least one message contains the distance requirement
      const hasDistanceMsg = distanceWarnings.some(
        (r) => r.message.includes("12 meter") || r.message.includes("20 meter"),
      );
      expect(hasDistanceMsg).toBe(true);
    });

    it("returns no warnings for exercises without minDistance", () => {
      // Build LA program with only exercises that have no minDistance
      // LA exercises without minDistance: 2,3,4,5,6,7,8,9,12,13,14
      const noDistanceExercises = LA.exercises.filter((e) => !e.minDistance);
      // This won't be a valid program (missing some exercises), but we're testing
      // that no min-distance warnings are generated for exercises without minDistance
      const entry = LA.exercises.find((e) => e.id === 14)!;
      const rest = noDistanceExercises.filter((e) => e.id !== 14);
      const program = [entry, ...rest];

      const results = validateProgram(LA, program);
      const distanceWarnings = results.filter(
        (r) => r.rule === "min-distance",
      );
      expect(distanceWarnings).toHaveLength(0);
    });
  });

  describe("RULE-03: forbidden exercises", () => {
    it("flags exercise not in level's exercise list as forbidden", () => {
      const program = validLAProgram();
      const forbiddenExercise: Exercise = {
        id: 999,
        name: "Passage",
        gait: "passage",
        coefficient: 2,
      };
      program.push(forbiddenExercise);

      const results = validateProgram(LA, program);
      const forbidden = results.filter((r) => r.rule === "forbidden-exercise");
      expect(forbidden.length).toBeGreaterThanOrEqual(1);
      expect(forbidden[0].severity).toBe("error");
      expect(forbidden[0].message).toContain("Passage");
      expect(forbidden[0].message).toContain("ikke tilladt");
    });
  });

  describe("D-08: entry and finale position", () => {
    it("detects entry not first", () => {
      // Put entry at index 2 instead of 0
      const exercises = LA.exercises.filter((e) => e.id !== 14);
      const entry = LA.exercises.find((e) => e.id === 14)!;
      const program = [exercises[0], exercises[1], entry, ...exercises.slice(2)];

      const results = validateProgram(LA, program);
      const posErrors = results.filter((r) => r.rule === "entry-position");
      expect(posErrors.length).toBeGreaterThanOrEqual(1);
      expect(posErrors[0].severity).toBe("error");
      expect(posErrors[0].message).toContain("Indridning");
    });

    it("detects entry/finale not last for levels with separate finale", () => {
      // Fabricate a level where entry and finale are different exercises
      const fabricatedLevel: KurLevel = {
        ...LA,
        id: "test-level",
        exercises: [
          ...LA.exercises,
          {
            id: 99,
            name: "Afslutningsparade",
            gait: "overgang",
            coefficient: 1,
          },
        ],
      };

      // Build program: entry first, but finale NOT last
      const entry = fabricatedLevel.exercises.find((e) => e.id === 14)!;
      const finale = fabricatedLevel.exercises.find((e) => e.id === 99)!;
      const rest = fabricatedLevel.exercises.filter(
        (e) => e.id !== 14 && e.id !== 99,
      );
      // Put finale in the middle, not at the end
      const program = [entry, finale, ...rest];

      const results = validateProgram(fabricatedLevel, program);
      const posErrors = results.filter((r) => r.rule === "finale-position");
      expect(posErrors.length).toBeGreaterThanOrEqual(1);
      expect(posErrors[0].severity).toBe("error");
    });
  });

  describe("edge cases", () => {
    it("Grand Prix level with empty forbidden array produces no forbidden errors", () => {
      const program = validGPProgram();
      const results = validateProgram(GP, program);

      const forbidden = results.filter((r) => r.rule === "forbidden-exercise");
      expect(forbidden).toHaveLength(0);
    });
  });
});
