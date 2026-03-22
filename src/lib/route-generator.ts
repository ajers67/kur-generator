import type { Exercise, Gait } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import type { PathPoint } from "@/components/ArenaCanvas";

export interface ArenaRoute {
  exerciseId: number;
  exerciseName: string;
  gait: Gait;
  points: PathPoint[];
  rating: StrengthRating;
}

// Exercise type classification for route template selection
export type ExerciseType =
  | "entry"
  | "extension"
  | "lateral"
  | "halvpas"
  | "pirouette"
  | "passage"
  | "piaffe"
  | "skridt"
  | "kontragalop"
  | "changer"
  | "volte"
  | "overgang"
  | "default";

// Arena letter positions (normalized 0-1, C at y=0, A at y=1)
const ARENA_LETTERS: Record<string, PathPoint> = {
  A: { x: 0.5, y: 1.0 },
  K: { x: 0.0, y: 0.9 },
  V: { x: 0.0, y: 0.7 },
  E: { x: 0.0, y: 0.5 },
  S: { x: 0.0, y: 0.3 },
  H: { x: 0.0, y: 0.1 },
  C: { x: 0.5, y: 0.0 },
  M: { x: 1.0, y: 0.1 },
  R: { x: 1.0, y: 0.3 },
  B: { x: 1.0, y: 0.5 },
  P: { x: 1.0, y: 0.7 },
  F: { x: 1.0, y: 0.9 },
  D: { x: 0.5, y: 0.85 },
  L: { x: 0.5, y: 0.65 },
  X: { x: 0.5, y: 0.5 },
  I: { x: 0.5, y: 0.35 },
  G: { x: 0.5, y: 0.15 },
};

// Seeded PRNG (mulberry32) — same algorithm as program-generator.ts
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper to create a point between two points
function lerp(a: PathPoint, b: PathPoint, t: number): PathPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Helper to generate circle points around a center
function circlePoints(
  center: PathPoint,
  radius: number,
  numPoints: number,
): PathPoint[] {
  const points: PathPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

// Classify an exercise by name and gait into an ExerciseType
export function classifyExercise(name: string, gait: Gait): ExerciseType {
  const lower = name.toLowerCase();

  // Entry must be checked first (before overgang catch-all)
  if (lower.includes("indridning")) return "entry";

  // Pirouette before lateral (halvpirouette contains "pirouette")
  if (lower.includes("pirouette")) return "pirouette";

  // Passage and piaffe by gait
  if (gait === "passage") return "passage";
  if (gait === "piaffe") return "piaffe";

  // Volte (check before extension since "samlet galop inkl. volte" should be volte)
  if (lower.includes("volte")) return "volte";

  // Changer/changement before extension
  if (lower.includes("changér") || lower.includes("changement") || lower.includes("changer")) return "changer";

  // Kontragalop before extension
  if (lower.includes("kontragalop")) return "kontragalop";

  // Halvpas
  if (lower.includes("halvpas")) return "halvpas";

  // Lateral movements
  if (
    lower.includes("schenkelvigning") ||
    lower.includes("versade") ||
    lower.includes("sidetraversade") ||
    lower.includes("skulderhind") ||
    lower.includes("travers")
  ) {
    return "lateral";
  }

  // Skridt types (must be after lateral to not catch "samlet skridt" in pirouette context)
  if (
    gait === "skridt" &&
    (lower.includes("skridt") || lower.includes("middelskridt"))
  ) {
    return "skridt";
  }

  // Extension/lengthening exercises
  if (
    lower.includes("middeltrav") ||
    lower.includes("fri trav") ||
    lower.includes("arbejdstrav") ||
    lower.includes("samlet trav") ||
    lower.includes("middelgalop") ||
    lower.includes("fri galop") ||
    lower.includes("arbejdsgalop") ||
    lower.includes("samlet galop")
  ) {
    return "extension";
  }

  // Overgang (non-entry)
  if (gait === "overgang" || lower.includes("overgang")) return "overgang";

  return "default";
}

// Route template variants per exercise type
// Each variant is an array of PathPoint[]. Variants are indexed by rating context.
interface RouteVariants {
  strength: PathPoint[][];  // variants preferred for strength rating
  weakness: PathPoint[][];  // variants preferred for weakness rating
  neutral: PathPoint[][];   // variants for neutral rating
}

function getRouteTemplates(): Record<ExerciseType, RouteVariants> {
  const A = ARENA_LETTERS;

  return {
    entry: {
      strength: [[A.A, A.D, A.X]],
      weakness: [[A.A, A.D, A.X]],
      neutral: [[A.A, A.D, A.X]],
    },

    extension: {
      // Strength: diagonals toward C (low y)
      strength: [
        [A.H, lerp(A.H, A.F, 0.33), lerp(A.H, A.F, 0.66), A.F],  // H->F
        [A.M, lerp(A.M, A.K, 0.33), lerp(A.M, A.K, 0.66), A.K],  // M->K
      ],
      // Weakness: diagonals away from C (high y)
      weakness: [
        [A.F, lerp(A.F, A.H, 0.33), lerp(A.F, A.H, 0.66), A.H],  // F->H
        [A.K, lerp(A.K, A.M, 0.33), lerp(A.K, A.M, 0.66), A.M],  // K->M
      ],
      // Neutral: mixed
      neutral: [
        [A.H, lerp(A.H, A.F, 0.33), lerp(A.H, A.F, 0.66), A.F],
        [A.F, lerp(A.F, A.H, 0.33), lerp(A.F, A.H, 0.66), A.H],
        [A.M, lerp(A.M, A.K, 0.33), lerp(A.M, A.K, 0.66), A.K],
        [A.K, lerp(A.K, A.M, 0.33), lerp(A.K, A.M, 0.66), A.M],
      ],
    },

    lateral: {
      // Strength: along left side toward C
      strength: [
        [A.V, A.E, A.S, A.H],  // Left side toward C
        [A.P, A.B, A.R, A.M],  // Right side toward C
      ],
      // Weakness: along side away from C
      weakness: [
        [A.S, A.E, A.V, A.K],  // Left side away from C
        [A.R, A.B, A.P, A.F],  // Right side away from C
      ],
      neutral: [
        [A.K, A.V, A.E, A.S],  // Left side
        [A.F, A.P, A.B, A.R],  // Right side
      ],
    },

    halvpas: {
      strength: [
        [A.I, lerp(A.I, A.M, 0.5), A.M],  // Diagonal toward C-side
        [A.I, lerp(A.I, A.H, 0.5), A.H],
      ],
      weakness: [
        [A.L, lerp(A.L, A.P, 0.5), A.P],  // Diagonal away from C
        [A.L, lerp(A.L, A.K, 0.5), A.K],
      ],
      neutral: [
        [A.X, lerp(A.X, A.R, 0.5), A.R],
        [A.X, lerp(A.X, A.S, 0.5), A.S],
      ],
    },

    pirouette: {
      // Strength: near G (y=0.15, toward C)
      strength: [circlePoints(A.G, 0.06, 8)],
      // Weakness: near L (y=0.65, toward A)
      weakness: [circlePoints(A.L, 0.06, 8)],
      neutral: [
        circlePoints(A.X, 0.06, 8),
        circlePoints(A.I, 0.06, 8),
      ],
    },

    passage: {
      // Strength: centerline from D toward C
      strength: [
        [A.D, A.L, A.X, A.I, A.G],
        [A.X, A.I, A.G, A.C],
      ],
      // Weakness: centerline from I toward A
      weakness: [
        [A.I, A.X, A.L, A.D],
        [A.G, A.I, A.X],
      ],
      neutral: [
        [A.D, A.L, A.X, A.I],
        [A.L, A.X, A.I, A.G],
      ],
    },

    piaffe: {
      // Strength: near G (toward C)
      strength: [
        [lerp(A.G, A.I, 0.3), A.G, lerp(A.G, A.C, 0.3)],
      ],
      // Weakness: near L (toward A)
      weakness: [
        [lerp(A.L, A.X, 0.3), A.L, lerp(A.L, A.D, 0.3)],
      ],
      neutral: [
        [lerp(A.X, A.I, 0.3), A.X, lerp(A.X, A.L, 0.3)],
        [lerp(A.I, A.G, 0.3), A.I, lerp(A.I, A.X, 0.3)],
      ],
    },

    skridt: {
      strength: [
        [A.V, A.E, A.S, A.H],  // Left long side toward C
        [A.P, A.B, A.R, A.M],  // Right long side toward C
      ],
      weakness: [
        [A.H, A.S, A.E, A.V],  // Left long side toward A
        [A.M, A.R, A.B, A.P],  // Right long side toward A
      ],
      neutral: [
        [A.K, A.V, A.E, A.S],
        [A.F, A.P, A.B, A.R],
      ],
    },

    kontragalop: {
      strength: [
        [A.V, A.E, A.S, A.H, lerp(A.H, A.C, 0.5)],
        [A.P, A.B, A.R, A.M, lerp(A.M, A.C, 0.5)],
      ],
      weakness: [
        [A.S, A.E, A.V, A.K, lerp(A.K, A.A, 0.5)],
        [A.R, A.B, A.P, A.F, lerp(A.F, A.A, 0.5)],
      ],
      neutral: [
        [A.K, A.V, A.E, A.S, A.H],
        [A.F, A.P, A.B, A.R, A.M],
      ],
    },

    changer: {
      strength: [
        [A.H, lerp(A.H, A.F, 0.33), A.X, lerp(A.X, A.F, 0.66), A.F],
        [A.M, lerp(A.M, A.K, 0.33), A.X, lerp(A.X, A.K, 0.66), A.K],
      ],
      weakness: [
        [A.F, lerp(A.F, A.H, 0.33), A.X, lerp(A.X, A.H, 0.66), A.H],
        [A.K, lerp(A.K, A.M, 0.33), A.X, lerp(A.X, A.M, 0.66), A.M],
      ],
      neutral: [
        [A.H, lerp(A.H, A.F, 0.5), A.X, A.F],
        [A.F, lerp(A.F, A.H, 0.5), A.X, A.H],
        [A.M, lerp(A.M, A.K, 0.5), A.X, A.K],
      ],
    },

    volte: {
      strength: [circlePoints(A.E, 0.12, 8), circlePoints(A.B, 0.12, 8)],
      weakness: [circlePoints(A.E, 0.12, 8), circlePoints(A.B, 0.12, 8)],
      neutral: [circlePoints(A.E, 0.12, 8), circlePoints(A.B, 0.12, 8)],
    },

    overgang: {
      strength: [
        [A.H, lerp(A.H, A.C, 0.5), A.C],
        [A.M, lerp(A.M, A.C, 0.5), A.C],
      ],
      weakness: [
        [A.K, lerp(A.K, A.A, 0.5), A.A],
        [A.F, lerp(A.F, A.A, 0.5), A.A],
      ],
      neutral: [
        [A.H, lerp(A.H, A.C, 0.5), A.C],
        [A.K, lerp(A.K, A.A, 0.5), A.A],
      ],
    },

    default: {
      strength: [
        [A.E, A.X, A.B],
      ],
      weakness: [
        [A.V, A.L, A.P],
      ],
      neutral: [
        [A.E, A.X, A.B],
        [A.V, A.L, A.P],
      ],
    },
  };
}

// Select a route variant based on rating and PRNG
function selectVariant(
  type: ExerciseType,
  rating: StrengthRating,
  rng: () => number,
  templates: Record<ExerciseType, RouteVariants>,
): PathPoint[] {
  const typeTemplates = templates[type];
  const variants = typeTemplates[rating];
  const index = Math.floor(rng() * variants.length);
  // Return a deep copy to avoid mutation
  return variants[index].map((p) => ({ ...p }));
}

interface GenerateRoutesOptions {
  seed?: number;
}

// Generate arena routes for a program order
export function generateRoutes(
  programOrder: Exercise[],
  ratings: Record<number, StrengthRating>,
  options?: GenerateRoutesOptions,
): ArenaRoute[] {
  const rng =
    options?.seed !== undefined
      ? mulberry32(options.seed)
      : () => Math.random();

  const templates = getRouteTemplates();
  const routes: ArenaRoute[] = [];

  for (const exercise of programOrder) {
    const rating = ratings[exercise.id] || "neutral";
    const type = classifyExercise(exercise.name, exercise.gait);
    const points = selectVariant(type, rating, rng, templates);

    routes.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      gait: exercise.gait,
      points,
      rating,
    });
  }

  return routes;
}
