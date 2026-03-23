import type { ArenaPath, PathPoint } from "@/components/ArenaCanvas";
import type { GaitDuration } from "@/lib/gait-duration";
import type { Gait } from "@/data/kur-levels";

export interface AnimationSegment {
  exerciseId: number;
  exerciseName: string;
  gait: Gait;
  points: PathPoint[];
  startTime: number;
  endTime: number;
}

export interface MarkerState {
  x: number;
  y: number;
  gait: Gait;
  exerciseIndex: number;
}

const TRANSITION_PAUSE = 0.5; // seconds between exercises (D-12)
const OVERGANG_DEFAULT_DURATION = 5; // seconds for overgang exercises with no gait duration

/**
 * Build an animation timeline from arena paths and gait durations.
 * Each path becomes a segment with timing derived from gait durations.
 * Per D-03: Uses calculateGaitDurations output for per-exercise timing.
 * Per D-04: Each exercise's duration = gaitDuration.durationSec / gaitDuration.exerciseCount.
 * Per D-12: 0.5s transition pause between exercises.
 */
export function buildAnimationTimeline(
  paths: ArenaPath[],
  gaitDurations: GaitDuration[],
): AnimationSegment[] {
  if (paths.length === 0) return [];

  // Build lookup: gait -> duration per exercise
  const durationPerExercise = new Map<string, number>();
  for (const gd of gaitDurations) {
    if (gd.exerciseCount > 0) {
      durationPerExercise.set(gd.gait, gd.durationSec / gd.exerciseCount);
    }
  }

  const segments: AnimationSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];

    // Add transition pause between exercises (not before first)
    if (i > 0) {
      currentTime += TRANSITION_PAUSE;
    }

    // Get exercise duration from gait durations, or default for overgang
    const exerciseDuration = durationPerExercise.get(path.gait)
      ?? OVERGANG_DEFAULT_DURATION;

    segments.push({
      exerciseId: path.exerciseId,
      exerciseName: path.exerciseName,
      gait: path.gait,
      points: path.points,
      startTime: currentTime,
      endTime: currentTime + exerciseDuration,
    });

    currentTime += exerciseDuration;
  }

  return segments;
}

/**
 * Get the marker position at a given time by interpolating along segment points.
 * Per D-05: Find active segment, interpolate along its points.
 * During transition pauses: returns last point of previous segment with next segment's gait (D-14).
 * Returns null if time is out of bounds.
 */
export function getPositionAtTime(
  timeline: AnimationSegment[],
  time: number,
): MarkerState | null {
  if (timeline.length === 0) return null;
  if (time < 0) return null;

  const totalDuration = getTotalDuration(timeline);
  if (time > totalDuration) return null;

  // Check if time falls within a segment
  for (let i = 0; i < timeline.length; i++) {
    const segment = timeline[i];

    if (time >= segment.startTime && time <= segment.endTime) {
      const progress = segment.endTime === segment.startTime
        ? 0
        : (time - segment.startTime) / (segment.endTime - segment.startTime);

      const pos = interpolateAlongPoints(segment.points, progress);
      return {
        x: pos.x,
        y: pos.y,
        gait: segment.gait,
        exerciseIndex: i,
      };
    }

    // Check if time falls in transition pause after this segment
    if (i < timeline.length - 1) {
      const nextSegment = timeline[i + 1];
      if (time > segment.endTime && time < nextSegment.startTime) {
        // During transition pause: return last point of current segment
        // with next segment's gait (D-14: shows gait change during pause)
        const lastPoint = segment.points[segment.points.length - 1];
        return {
          x: lastPoint.x,
          y: lastPoint.y,
          gait: nextSegment.gait,
          exerciseIndex: i,
        };
      }
    }
  }

  return null;
}

/**
 * Get total duration of the timeline (last segment's endTime).
 */
export function getTotalDuration(timeline: AnimationSegment[]): number {
  if (timeline.length === 0) return 0;
  return timeline[timeline.length - 1].endTime;
}

/**
 * Interpolate along an array of points.
 * Progress 0 = first point, progress 1 = last point.
 */
function interpolateAlongPoints(points: PathPoint[], progress: number): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  // Clamp progress
  const t = Math.max(0, Math.min(1, progress));

  // Calculate cumulative distances for proper arc-length parameterization
  const distances: number[] = [0];
  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
    distances.push(totalDistance);
  }

  if (totalDistance === 0) return points[0];

  // Find target distance
  const targetDistance = t * totalDistance;

  // Find which segment we're on
  for (let i = 1; i < distances.length; i++) {
    if (targetDistance <= distances[i]) {
      const segmentStart = distances[i - 1];
      const segmentEnd = distances[i];
      const segmentLength = segmentEnd - segmentStart;

      if (segmentLength === 0) return points[i - 1];

      const segmentT = (targetDistance - segmentStart) / segmentLength;

      return {
        x: points[i - 1].x + segmentT * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + segmentT * (points[i].y - points[i - 1].y),
      };
    }
  }

  return points[points.length - 1];
}
