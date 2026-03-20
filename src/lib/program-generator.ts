import type { KurLevel, Exercise } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";

export function generateProgramOrder(
  level: KurLevel,
  ratings: Record<number, StrengthRating>,
  temperament: "calm" | "neutral" | "energetic"
): Exercise[] {
  const exercises = [...level.exercises];
  const skridt = exercises.filter((e) => e.gait === "skridt");
  const trav = exercises.filter((e) => e.gait === "trav");
  const galop = exercises.filter((e) => e.gait === "galop");
  const overgang = exercises.filter((e) => e.gait === "overgang");
  const passage = exercises.filter((e) => e.gait === "passage");
  const piaffe = exercises.filter((e) => e.gait === "piaffe");

  const sortByStrength = (a: Exercise, b: Exercise) => {
    const order: Record<StrengthRating, number> = { strength: 0, neutral: 1, weakness: 2 };
    return (order[ratings[a.id] || "neutral"]) - (order[ratings[b.id] || "neutral"]);
  };

  trav.sort(sortByStrength);
  galop.sort(sortByStrength);

  const entryExercise = overgang.find((e) => e.name.includes("Indridning"));
  const restOvergang = overgang.filter((e) => !e.name.includes("Indridning"));

  let program: Exercise[] = [];
  if (entryExercise) program.push(entryExercise);

  if (temperament === "calm") {
    program = [...program, ...skridt, ...trav, ...galop];
  } else if (temperament === "energetic") {
    program = [...program, ...trav, ...galop.slice(0, Math.ceil(galop.length / 2)), ...skridt, ...galop.slice(Math.ceil(galop.length / 2))];
  } else {
    program = [...program, ...trav, ...skridt, ...galop];
  }

  program = [...program, ...passage, ...piaffe, ...restOvergang];

  const seen = new Set<number>();
  return program.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}
