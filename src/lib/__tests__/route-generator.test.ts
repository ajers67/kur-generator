import { describe, it, expect } from "vitest";
import {
  generateRoutes,
  classifyExercise,
  type ArenaRoute,
} from "../route-generator";
import type { Exercise, Gait } from "@/data/kur-levels";
import { KUR_LEVELS } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

// Helper to create a minimal exercise
function makeExercise(
  id: number,
  name: string,
  gait: Gait,
  coefficient = 1,
): Exercise {
  return { id, name, gait, coefficient };
}

describe("classifyExercise", () => {
  it("classifies skridt exercises", () => {
    expect(classifyExercise("Middelskridt", "skridt")).toBe("skridt");
    expect(classifyExercise("Fri skridt", "skridt")).toBe("skridt");
    expect(classifyExercise("Samlet skridt", "skridt")).toBe("skridt");
  });

  it("classifies extension exercises in trav", () => {
    expect(classifyExercise("Middeltrav", "trav")).toBe("extension");
    expect(classifyExercise("Fri trav", "trav")).toBe("extension");
    expect(classifyExercise("Arbejdstrav", "trav")).toBe("extension");
  });

  it("classifies extension exercises in galop", () => {
    expect(classifyExercise("Middelgalop", "galop")).toBe("extension");
    expect(classifyExercise("Fri galop", "galop")).toBe("extension");
    expect(classifyExercise("Arbejdsgalop", "galop")).toBe("extension");
  });

  it("classifies lateral exercises", () => {
    expect(classifyExercise("Schenkelvigning i trav til venstre", "trav")).toBe("lateral");
    expect(classifyExercise("Versade bøjet til højre (samlet trav)", "trav")).toBe("lateral");
    expect(classifyExercise("Sidetraversade til venstre (samlet trav)", "trav")).toBe("lateral");
    expect(classifyExercise("Skulderhind til venstre", "trav")).toBe("lateral");
    expect(classifyExercise("Galop travers til højre (samlet galop)", "galop")).toBe("lateral");
  });

  it("classifies halvpas exercises", () => {
    expect(classifyExercise("Halvpas til venstre", "trav")).toBe("halvpas");
  });

  it("classifies pirouette exercises", () => {
    expect(classifyExercise("Halvpirouette i samlet skridt (H og/eller V)", "skridt")).toBe("pirouette");
    expect(classifyExercise("Enkelt-pirouette i galop til højre", "galop")).toBe("pirouette");
    expect(classifyExercise("Galop pirouette til venstre", "galop")).toBe("pirouette");
    expect(classifyExercise("Halvpirouette i galop til højre", "galop")).toBe("pirouette");
  });

  it("classifies passage", () => {
    expect(classifyExercise("Passage", "passage")).toBe("passage");
  });

  it("classifies piaffe", () => {
    expect(classifyExercise("Piaffe", "piaffe")).toBe("piaffe");
  });

  it("classifies kontragalop", () => {
    expect(classifyExercise("Kontragalop til venstre", "galop")).toBe("kontragalop");
  });

  it("classifies changer exercises", () => {
    expect(classifyExercise("Changér galop gennem skridt (H→V)", "galop")).toBe("changer");
    expect(classifyExercise("Changement til højre", "galop")).toBe("changer");
    expect(classifyExercise("Changementer for hvert 3. spring (min. 5 sammenhængende)", "galop")).toBe("changer");
  });

  it("classifies volte exercises", () => {
    expect(classifyExercise("Volte 10 meter til venstre", "trav")).toBe("volte");
    expect(classifyExercise("Samlet galop inkl. volte 8m (H og/eller V)", "galop")).toBe("volte");
  });

  it("classifies entry (indridning)", () => {
    expect(classifyExercise("Indridning samt indridnings- og afslutningsparade", "overgang")).toBe("entry");
  });

  it("classifies overgang exercises", () => {
    expect(classifyExercise("Overgange fra passage til piaffe og omvendt", "overgang")).toBe("overgang");
  });

  it("classifies unknown exercises as default", () => {
    expect(classifyExercise("Completely Unknown Exercise", "trav")).toBe("default");
  });
});

describe("generateRoutes — route templates", () => {
  it("entry route starts at A (y=1.0) heading toward X (y=0.5)", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    expect(routes).toHaveLength(1);
    expect(routes[0].points[0].x).toBeCloseTo(0.5, 1);
    expect(routes[0].points[0].y).toBeCloseTo(1.0, 1);
    // End point heading toward X
    const last = routes[0].points[routes[0].points.length - 1];
    expect(last.y).toBeLessThan(0.7);
  });

  it("extension route uses diagonal points", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    expect(routes).toHaveLength(2);
    const extRoute = routes[1];
    expect(extRoute.points.length).toBeGreaterThanOrEqual(2);
    // Diagonal should span a significant portion of the arena
    const xs = extRoute.points.map((p) => p.x);
    const ys = extRoute.points.map((p) => p.y);
    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);
    expect(xRange + yRange).toBeGreaterThan(0.3);
  });

  it("volte route forms a circle approximation", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Volte 10 meter til venstre", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    const volteRoute = routes[1];
    expect(volteRoute.points.length).toBeGreaterThanOrEqual(6);
  });
});

describe("generateRoutes — zone placement", () => {
  it("strength extension routes toward C (low y average)", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "strength" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    const extRoute = routes[1];
    const avgY = extRoute.points.reduce((sum, p) => sum + p.y, 0) / extRoute.points.length;
    expect(avgY).toBeLessThan(0.5);
  });

  it("weakness extension routes away from C (high y average)", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "weakness" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    const extRoute = routes[1];
    const avgY = extRoute.points.reduce((sum, p) => sum + p.y, 0) / extRoute.points.length;
    expect(avgY).toBeGreaterThan(0.5);
  });

  it("neutral exercises use standard placement", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    expect(routes[1].rating).toBe("neutral");
    expect(routes[1].points.length).toBeGreaterThanOrEqual(2);
  });
});

describe("generateRoutes — transitions and connectivity", () => {
  it("first route starts at A (entry)", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Arbejdstrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    expect(routes[0].points[0].x).toBeCloseTo(0.5, 1);
    expect(routes[0].points[0].y).toBeCloseTo(1.0, 1);
  });

  it("returns one ArenaRoute per exercise in programOrder", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Arbejdstrav", "trav"),
      makeExercise(3, "Middelskridt", "skridt"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral", 3: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    expect(routes).toHaveLength(3);
    expect(routes[0].exerciseId).toBe(1);
    expect(routes[1].exerciseId).toBe(2);
    expect(routes[2].exerciseId).toBe(3);
  });

  it("each route has startPoint and endPoint accessible", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Arbejdstrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };
    const routes = generateRoutes(exercises, ratings, { seed: 42 });

    for (const route of routes) {
      expect(route.points.length).toBeGreaterThanOrEqual(2);
      expect(route.points[0]).toHaveProperty("x");
      expect(route.points[0]).toHaveProperty("y");
      expect(route.points[route.points.length - 1]).toHaveProperty("x");
      expect(route.points[route.points.length - 1]).toHaveProperty("y");
    }
  });
});

describe("generateRoutes — seeded randomization", () => {
  it("same seed produces identical routes", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
      makeExercise(3, "Middelgalop", "galop"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral", 3: "neutral" };

    const routes1 = generateRoutes(exercises, ratings, { seed: 123 });
    const routes2 = generateRoutes(exercises, ratings, { seed: 123 });

    expect(routes1).toEqual(routes2);
  });

  it("different seed produces at least one different route", () => {
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
      makeExercise(3, "Middelgalop", "galop"),
      makeExercise(4, "Arbejdstrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral", 3: "neutral", 4: "neutral" };

    const routes1 = generateRoutes(exercises, ratings, { seed: 100 });
    const routes2 = generateRoutes(exercises, ratings, { seed: 999 });

    // At least one route should differ
    const allSame = routes1.every((r, i) =>
      JSON.stringify(r.points) === JSON.stringify(routes2[i].points),
    );
    expect(allSame).toBe(false);
  });

  it("no seed produces non-deterministic results (uses Math.random)", () => {
    // We just verify it doesn't throw when no seed is provided
    const exercises: Exercise[] = [
      makeExercise(1, "Indridning samt indridnings- og afslutningsparade", "overgang"),
      makeExercise(2, "Middeltrav", "trav"),
    ];
    const ratings: Record<number, StrengthRating> = { 1: "neutral", 2: "neutral" };

    const routes = generateRoutes(exercises, ratings);
    expect(routes).toHaveLength(2);
  });
});

describe("generateRoutes — full integration with LA level", () => {
  it("generates one ArenaRoute per exercise for LA level", () => {
    const la = KUR_LEVELS.find((l) => l.id === "la")!;
    const ratings: Record<number, StrengthRating> = {};
    for (const ex of la.exercises) {
      ratings[ex.id] = "neutral";
    }

    const routes = generateRoutes(la.exercises, ratings, { seed: 42 });

    expect(routes).toHaveLength(la.exercises.length);
    for (const route of routes) {
      expect(route.exerciseId).toBeGreaterThan(0);
      expect(route.exerciseName).toBeTruthy();
      expect(route.gait).toBeTruthy();
      expect(route.points.length).toBeGreaterThanOrEqual(2);
      expect(route.rating).toBeTruthy();
    }
  });

  it("generates routes for Grand Prix level with passage/piaffe", () => {
    const gp = KUR_LEVELS.find((l) => l.id === "grand-prix")!;
    const ratings: Record<number, StrengthRating> = {};
    for (const ex of gp.exercises) {
      ratings[ex.id] = ex.gait === "passage" ? "strength" : "neutral";
    }

    const routes = generateRoutes(gp.exercises, ratings, { seed: 42 });

    expect(routes).toHaveLength(gp.exercises.length);

    // Find passage route and verify it's toward C
    const passageRoute = routes.find((r) => r.gait === "passage");
    expect(passageRoute).toBeDefined();
    if (passageRoute) {
      const avgY = passageRoute.points.reduce((s, p) => s + p.y, 0) / passageRoute.points.length;
      expect(avgY).toBeLessThan(0.5);
    }
  });
});
