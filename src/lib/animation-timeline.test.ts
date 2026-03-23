import { describe, it, expect } from "vitest";
import { buildAnimationTimeline, getPositionAtTime, getTotalDuration } from "./animation-timeline";
import type { ArenaPath, PathPoint } from "@/components/ArenaCanvas";
import type { GaitDuration } from "@/lib/gait-duration";
import type { Gait } from "@/data/kur-levels";

// Mock data: 3 exercises (skridt, trav, galop) with simple paths
const mockPaths: ArenaPath[] = [
  {
    exerciseId: 1,
    exerciseName: "Indridning",
    gait: "skridt" as Gait,
    points: [
      { x: 0.5, y: 1.0 },
      { x: 0.5, y: 0.75 },
      { x: 0.5, y: 0.5 },
    ],
  },
  {
    exerciseId: 2,
    exerciseName: "Mellemtrav",
    gait: "trav" as Gait,
    points: [
      { x: 0.5, y: 0.5 },
      { x: 0.0, y: 0.5 },
      { x: 0.0, y: 0.0 },
      { x: 0.5, y: 0.0 },
    ],
  },
  {
    exerciseId: 3,
    exerciseName: "Galop højre",
    gait: "galop" as Gait,
    points: [
      { x: 0.5, y: 0.0 },
      { x: 1.0, y: 0.0 },
      { x: 1.0, y: 1.0 },
    ],
  },
];

const mockGaitDurations: GaitDuration[] = [
  { gait: "skridt", durationSec: 30, exerciseCount: 1, totalCoefficient: 2 },
  { gait: "trav", durationSec: 60, exerciseCount: 1, totalCoefficient: 4 },
  { gait: "galop", durationSec: 45, exerciseCount: 1, totalCoefficient: 3 },
];

describe("buildAnimationTimeline", () => {
  it("returns empty array for empty paths", () => {
    const result = buildAnimationTimeline([], mockGaitDurations);
    expect(result).toEqual([]);
  });

  it("returns one AnimationSegment per ArenaPath", () => {
    const result = buildAnimationTimeline(mockPaths, mockGaitDurations);
    expect(result).toHaveLength(3);
  });

  it("each segment has startTime/endTime derived from gait durations", () => {
    const result = buildAnimationTimeline(mockPaths, mockGaitDurations);
    // First segment: skridt, 30s total / 1 exercise = 30s
    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(30);
    // Second segment: trav, 60s / 1 = 60s, starts at 30 + 0.5 transition
    expect(result[1].startTime).toBe(30.5);
    expect(result[1].endTime).toBe(90.5);
    // Third segment: galop, 45s / 1 = 45s, starts at 90.5 + 0.5 transition
    expect(result[2].startTime).toBe(91);
    expect(result[2].endTime).toBe(136);
  });

  it("segments are sequential with 0.5s transition pause", () => {
    const result = buildAnimationTimeline(mockPaths, mockGaitDurations);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].startTime).toBe(result[i - 1].endTime + 0.5);
    }
  });

  it("total duration equals sum of gait durations + transition pauses", () => {
    const result = buildAnimationTimeline(mockPaths, mockGaitDurations);
    const totalDuration = getTotalDuration(result);
    // 30 + 60 + 45 = 135 exercise time + 2 * 0.5 = 1 transition time = 136
    expect(totalDuration).toBe(136);
  });
});

describe("getPositionAtTime", () => {
  const timeline = buildAnimationTimeline(mockPaths, mockGaitDurations);

  it("returns first point at t=0", () => {
    const pos = getPositionAtTime(timeline, 0);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(0.5);
    expect(pos!.y).toBeCloseTo(1.0);
  });

  it("returns last point at t=totalDuration", () => {
    const total = getTotalDuration(timeline);
    const pos = getPositionAtTime(timeline, total);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(1.0);
    expect(pos!.y).toBeCloseTo(1.0);
  });

  it("returns interpolated midpoint at segment midtime", () => {
    // First segment: 0-30s, 3 points. At t=15 (midpoint), should be at middle point
    const pos = getPositionAtTime(timeline, 15);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(0.5);
    expect(pos!.y).toBeCloseTo(0.75);
  });

  it("returns correct gait for current segment", () => {
    // t=0 -> skridt
    const pos1 = getPositionAtTime(timeline, 0);
    expect(pos1!.gait).toBe("skridt");
    // t=50 -> trav (segment starts at 30.5)
    const pos2 = getPositionAtTime(timeline, 50);
    expect(pos2!.gait).toBe("trav");
    // t=100 -> galop (segment starts at 91)
    const pos3 = getPositionAtTime(timeline, 100);
    expect(pos3!.gait).toBe("galop");
  });

  it("returns null for time < 0", () => {
    expect(getPositionAtTime(timeline, -1)).toBeNull();
  });

  it("returns null for time > totalDuration", () => {
    const total = getTotalDuration(timeline);
    expect(getPositionAtTime(timeline, total + 1)).toBeNull();
  });

  it("returns position during transition pause between segments", () => {
    // Transition pause: 30.0 to 30.5 (between segment 0 end and segment 1 start)
    const pos = getPositionAtTime(timeline, 30.25);
    expect(pos).not.toBeNull();
    // Should return last point of previous segment
    expect(pos!.x).toBeCloseTo(0.5);
    expect(pos!.y).toBeCloseTo(0.5);
    // Gait should be next segment's gait (shows gait change during pause per D-14)
    expect(pos!.gait).toBe("trav");
  });
});

describe("overgang gait handling", () => {
  it("overgang exercises are included with 5s default duration", () => {
    const pathsWithOvergang: ArenaPath[] = [
      {
        exerciseId: 1,
        exerciseName: "Indridning",
        gait: "skridt" as Gait,
        points: [{ x: 0.5, y: 1.0 }, { x: 0.5, y: 0.5 }],
      },
      {
        exerciseId: 10,
        exerciseName: "Overgang til trav",
        gait: "overgang" as Gait,
        points: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.4 }],
      },
      {
        exerciseId: 2,
        exerciseName: "Mellemtrav",
        gait: "trav" as Gait,
        points: [{ x: 0.5, y: 0.4 }, { x: 0.0, y: 0.0 }],
      },
    ];

    const durations: GaitDuration[] = [
      { gait: "skridt", durationSec: 30, exerciseCount: 1, totalCoefficient: 2 },
      { gait: "trav", durationSec: 60, exerciseCount: 1, totalCoefficient: 4 },
    ];

    const result = buildAnimationTimeline(pathsWithOvergang, durations);
    expect(result).toHaveLength(3);
    // Overgang segment should have 5s default
    expect(result[1].gait).toBe("overgang");
    expect(result[1].endTime - result[1].startTime).toBe(5);
  });
});

describe("getTotalDuration", () => {
  it("returns 0 for empty timeline", () => {
    expect(getTotalDuration([])).toBe(0);
  });

  it("returns last segment endTime", () => {
    const timeline = buildAnimationTimeline(mockPaths, mockGaitDurations);
    expect(getTotalDuration(timeline)).toBe(136);
  });
});
