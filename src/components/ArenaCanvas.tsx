"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GAIT_COLORS } from "@/data/kur-levels";
import type { Gait } from "@/data/kur-levels";

// Standard 20x60m arena letter positions (normalized 0-1)
const ARENA_LETTERS_60: Record<string, { x: number; y: number; side: "left" | "right" | "top" | "bottom" }> = {
  A: { x: 0.5, y: 1.0, side: "bottom" },
  K: { x: 0.0, y: 0.9, side: "left" },
  V: { x: 0.0, y: 0.7, side: "left" },
  E: { x: 0.0, y: 0.5, side: "left" },
  S: { x: 0.0, y: 0.3, side: "left" },
  H: { x: 0.0, y: 0.1, side: "left" },
  C: { x: 0.5, y: 0.0, side: "top" },
  M: { x: 1.0, y: 0.1, side: "right" },
  R: { x: 1.0, y: 0.3, side: "right" },
  B: { x: 1.0, y: 0.5, side: "right" },
  P: { x: 1.0, y: 0.7, side: "right" },
  F: { x: 1.0, y: 0.9, side: "right" },
  // Center line
  D: { x: 0.5, y: 0.85, side: "bottom" },
  L: { x: 0.5, y: 0.65, side: "bottom" },
  X: { x: 0.5, y: 0.5, side: "bottom" },
  I: { x: 0.5, y: 0.35, side: "bottom" },
  G: { x: 0.5, y: 0.15, side: "bottom" },
};

export interface PathPoint {
  x: number;
  y: number;
}

export interface ArenaPath {
  points: PathPoint[];
  gait: Gait;
  exerciseId: number;
  exerciseName: string;
}

// Minimum distance from a point to a line segment (all in normalized coords)
function distToSegment(p: PathPoint, a: PathPoint, b: PathPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

// Find the nearest route to a point within a hit threshold
function findNearestRoute(point: PathPoint, paths: ArenaPath[]): number | null {
  const threshold = 0.04; // normalized coords
  let bestDist = Infinity;
  let bestIndex: number | null = null;

  for (let i = 0; i < paths.length; i++) {
    const pts = paths[i].points;
    for (let j = 0; j < pts.length - 1; j++) {
      const d = distToSegment(point, pts[j], pts[j + 1]);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    // Also check distance to individual points (for short paths)
    for (const pt of pts) {
      const d = Math.hypot(point.x - pt.x, point.y - pt.y);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
  }

  return bestDist < threshold ? bestIndex : null;
}

interface Props {
  width?: number;
  height?: number;
  paths: ArenaPath[];
  currentPath?: PathPoint[];
  currentGait?: Gait;
  isDrawing?: boolean;
  onMouseDown?: (point: PathPoint) => void;
  onMouseMove?: (point: PathPoint) => void;
  onMouseUp?: () => void;
  sequenceNumber?: number;
  labels?: { exerciseId: number; label: string; point: PathPoint }[];
  transitions?: { from: PathPoint; to: PathPoint }[];
  // Route interaction props (separate from drawing mode)
  selectedRouteIndex?: number | null;
  onRouteSelect?: (index: number | null) => void;
  onRouteMove?: (index: number, newPoints: PathPoint[]) => void;
  // Animation marker overlay
  markerPosition?: { x: number; y: number; gait: Gait } | null;
  activeExerciseIndex?: number;
}

export function ArenaCanvas({
  width = 300,
  height = 450,
  paths,
  currentPath = [],
  currentGait = "trav",
  isDrawing = false,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  sequenceNumber,
  labels,
  transitions,
  selectedRouteIndex,
  onRouteSelect,
  onRouteMove,
  markerPosition,
  activeExerciseIndex,
}: Props) {
  const isDrawInteractive = !!(onMouseDown && onMouseMove && onMouseUp);
  const isRouteInteractive = !!(onRouteSelect && onRouteMove) && !isDrawInteractive;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drag state for route movement
  const dragStartRef = useRef<PathPoint | null>(null);
  const isDraggingRouteRef = useRef(false);
  const [dragOffset, setDragOffset] = useState<PathPoint | null>(null);

  const padding = 30;
  const arenaW = width - padding * 2;
  const arenaH = height - padding * 2;

  const toCanvasCoords = useCallback(
    (nx: number, ny: number) => ({
      cx: padding + nx * arenaW,
      cy: padding + ny * arenaH,
    }),
    [arenaW, arenaH]
  );

  const fromCanvasCoords = useCallback(
    (cx: number, cy: number) => ({
      x: Math.max(0, Math.min(1, (cx - padding) / arenaW)),
      y: Math.max(0, Math.min(1, (cy - padding) / arenaH)),
    }),
    [arenaW, arenaH]
  );

  // Get effective points for a path (applying drag offset if it's the selected route)
  const getEffectivePoints = useCallback(
    (pathIndex: number, points: PathPoint[]): PathPoint[] => {
      if (pathIndex !== selectedRouteIndex || !dragOffset) return points;
      return points.map((p) => ({
        x: Math.max(0, Math.min(1, p.x + dragOffset.x)),
        y: Math.max(0, Math.min(1, p.y + dragOffset.y)),
      }));
    },
    [selectedRouteIndex, dragOffset]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Arena background
    ctx.fillStyle = "#f8f6f0";
    ctx.fillRect(padding, padding, arenaW, arenaH);

    // Arena border
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, arenaW, arenaH);

    // Center line (dashed)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#d4c5a9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const clTop = toCanvasCoords(0.5, 0);
    const clBottom = toCanvasCoords(0.5, 1);
    ctx.moveTo(clTop.cx, clTop.cy);
    ctx.lineTo(clBottom.cx, clBottom.cy);
    ctx.stroke();

    // Quarter lines
    const qlLeft = toCanvasCoords(0.25, 0);
    const qlLeftB = toCanvasCoords(0.25, 1);
    ctx.beginPath();
    ctx.moveTo(qlLeft.cx, qlLeft.cy);
    ctx.lineTo(qlLeftB.cx, qlLeftB.cy);
    ctx.stroke();

    const qlRight = toCanvasCoords(0.75, 0);
    const qlRightB = toCanvasCoords(0.75, 1);
    ctx.beginPath();
    ctx.moveTo(qlRight.cx, qlRight.cy);
    ctx.lineTo(qlRightB.cx, qlRightB.cy);
    ctx.stroke();

    ctx.setLineDash([]);

    // Letters
    ctx.fillStyle = "#5a4a3a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const [letter, pos] of Object.entries(ARENA_LETTERS_60)) {
      // Skip invisible center-line letters except X
      if (["D", "L", "I", "G"].includes(letter)) continue;

      const { cx, cy } = toCanvasCoords(pos.x, pos.y);
      let lx = cx;
      let ly = cy;

      if (pos.side === "left") lx -= 16;
      else if (pos.side === "right") lx += 16;
      else if (pos.side === "top") ly -= 14;
      else if (pos.side === "bottom") ly += 14;

      ctx.fillText(letter, lx, ly);

      // Small tick mark
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (pos.side === "left") {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 4, cy);
      } else if (pos.side === "right") {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 4, cy);
      }
      ctx.stroke();
    }

    // X marker
    const xPos = toCanvasCoords(0.5, 0.5);
    ctx.fillStyle = "#5a4a3a";
    ctx.font = "10px sans-serif";
    ctx.fillText("X", xPos.cx + 10, xPos.cy);

    // Draw completed paths
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (path.points.length < 2) continue;
      const effectivePoints = getEffectivePoints(i, path.points);
      const isSelected = i === selectedRouteIndex;
      const color = GAIT_COLORS[path.gait];
      const dashed = path.gait === "skridt";

      // Trail effect: dim upcoming routes when animation marker is active (D-09)
      const trailAlpha = (markerPosition && activeExerciseIndex !== undefined)
        ? (i <= activeExerciseIndex ? 1 : 0.3)
        : 1;

      if (isSelected) {
        // Glow effect for selected route
        drawPath(ctx, effectivePoints, color, dashed, 6, 0.3 * trailAlpha);
        // Thicker stroke for selected route
        drawPath(ctx, effectivePoints, color, dashed, 4.5, trailAlpha);
      } else {
        drawPath(ctx, effectivePoints, color, dashed, 2.5, trailAlpha);
      }
    }

    // Draw current path being drawn
    if (currentPath.length >= 2) {
      drawPath(ctx, currentPath, GAIT_COLORS[currentGait], currentGait === "skridt", 2.5, 1);
    }

    // Draw transition lines (gray dashed)
    if (transitions && transitions.length > 0) {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      for (let ti = 0; ti < transitions.length; ti++) {
        const t = transitions[ti];
        // Apply drag offset to transition endpoints if adjacent to selected route
        let fromPt = t.from;
        let toPt = t.to;
        if (dragOffset && selectedRouteIndex !== null && selectedRouteIndex !== undefined) {
          // transition[i] connects route[i] end to route[i+1] start
          if (ti === selectedRouteIndex - 1) {
            // This transition ends at the selected route's start — adjust 'to'
            toPt = {
              x: Math.max(0, Math.min(1, toPt.x + dragOffset.x)),
              y: Math.max(0, Math.min(1, toPt.y + dragOffset.y)),
            };
          }
          if (ti === selectedRouteIndex) {
            // This transition starts from the selected route's end — adjust 'from'
            fromPt = {
              x: Math.max(0, Math.min(1, fromPt.x + dragOffset.x)),
              y: Math.max(0, Math.min(1, fromPt.y + dragOffset.y)),
            };
          }
        }
        const from = toCanvasCoords(fromPt.x, fromPt.y);
        const to = toCanvasCoords(toPt.x, toPt.y);
        ctx.beginPath();
        ctx.moveTo(from.cx, from.cy);
        ctx.lineTo(to.cx, to.cy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw exercise labels at midpoints
    if (labels && labels.length > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let li = 0; li < labels.length; li++) {
        const lbl = labels[li];
        // Apply drag offset to label if it belongs to the selected route
        let labelPoint = lbl.point;
        if (dragOffset && li === selectedRouteIndex) {
          labelPoint = {
            x: Math.max(0, Math.min(1, lbl.point.x + dragOffset.x)),
            y: Math.max(0, Math.min(1, lbl.point.y + dragOffset.y)),
          };
        }
        const pos = toCanvasCoords(labelPoint.x, labelPoint.y);
        // Find matching path to get gait color
        const matchedPath = paths.find((p) => p.exerciseId === lbl.exerciseId);
        const color = matchedPath ? GAIT_COLORS[matchedPath.gait] : "#374151";

        const isSelected = li === selectedRouteIndex;
        ctx.font = isSelected ? "bold 11px sans-serif" : "9px sans-serif";

        // Measure text for background
        const textMetrics = ctx.measureText(lbl.label);
        const textW = textMetrics.width + 6;
        const textH = isSelected ? 16 : 14;

        // White rounded rect background
        const rx = pos.cx - textW / 2;
        const ry = pos.cy - textH / 2;
        ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(rx, ry, textW, textH, 3);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label text
        ctx.fillStyle = color;
        ctx.fillText(lbl.label, pos.cx, pos.cy);
      }
    }

    // Sequence number
    if (sequenceNumber !== undefined) {
      ctx.fillStyle = "#374151";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`#${sequenceNumber}`, 4, 16);
    }

    // Animation marker (D-06)
    if (markerPosition) {
      const { cx, cy } = toCanvasCoords(markerPosition.x, markerPosition.y);
      const markerColor = GAIT_COLORS[markerPosition.gait];

      // Filled circle (radius 8px per D-06)
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = markerColor;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // White center dot for visibility
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }, [width, height, arenaW, arenaH, paths, currentPath, currentGait, toCanvasCoords, sequenceNumber, labels, transitions, selectedRouteIndex, getEffectivePoints, dragOffset, markerPosition, activeExerciseIndex]);

  function drawPath(ctx: CanvasRenderingContext2D, points: PathPoint[], color: string, dashed: boolean, lineWidth: number, alpha: number) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(dashed ? [6, 4] : []);

    ctx.beginPath();
    const first = toCanvasCoords(points[0].x, points[0].y);
    ctx.moveTo(first.cx, first.cy);

    for (let i = 1; i < points.length; i++) {
      const p = toCanvasCoords(points[i].x, points[i].y);
      ctx.lineTo(p.cx, p.cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Start dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(first.cx, first.cy, lineWidth > 3 ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();

    // End arrow
    if (points.length >= 2) {
      const last = toCanvasCoords(points[points.length - 1].x, points[points.length - 1].y);
      ctx.beginPath();
      ctx.arc(last.cx, last.cy, lineWidth > 3 ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerEvent = (e: React.PointerEvent, handler: (p: PathPoint) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const point = fromCanvasCoords(cx, cy);
    handler(point);
  };

  // Route interaction handlers
  const handleRoutePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onRouteSelect || !onRouteMove) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const point = fromCanvasCoords(cx, cy);

      const hitIndex = findNearestRoute(point, paths);
      onRouteSelect(hitIndex);

      if (hitIndex !== null) {
        dragStartRef.current = point;
        isDraggingRouteRef.current = false;
        // Capture pointer for smooth dragging
        canvas.setPointerCapture(e.pointerId);
      } else {
        dragStartRef.current = null;
        isDraggingRouteRef.current = false;
        setDragOffset(null);
      }
    },
    [fromCanvasCoords, onRouteSelect, onRouteMove, paths]
  );

  const handleRoutePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!onRouteSelect || !onRouteMove) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const point = fromCanvasCoords(cx, cy);

      if (dragStartRef.current && selectedRouteIndex !== null && selectedRouteIndex !== undefined) {
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;

        // Start dragging after small threshold
        if (!isDraggingRouteRef.current && Math.hypot(dx, dy) > 0.01) {
          isDraggingRouteRef.current = true;
        }

        if (isDraggingRouteRef.current) {
          setDragOffset({ x: dx, y: dy });
        }
      } else {
        // Hover hit test for cursor change
        const hitIndex = findNearestRoute(point, paths);
        canvas.style.cursor = hitIndex !== null ? "pointer" : "default";
      }
    },
    [fromCanvasCoords, onRouteSelect, onRouteMove, paths, selectedRouteIndex]
  );

  const handleRoutePointerUp = useCallback(
    () => {
      if (!onRouteMove) return;

      if (isDraggingRouteRef.current && selectedRouteIndex !== null && selectedRouteIndex !== undefined && dragOffset) {
        // Compute final translated points, clamped to 0-1
        const path = paths[selectedRouteIndex];
        const newPoints = path.points.map((p) => ({
          x: Math.max(0, Math.min(1, p.x + dragOffset.x)),
          y: Math.max(0, Math.min(1, p.y + dragOffset.y)),
        }));
        onRouteMove(selectedRouteIndex, newPoints);
      }

      dragStartRef.current = null;
      isDraggingRouteRef.current = false;
      setDragOffset(null);
    },
    [onRouteMove, selectedRouteIndex, dragOffset, paths]
  );

  // Non-interactive (read-only) mode
  if (!isDrawInteractive && !isRouteInteractive) {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg"
      />
    );
  }

  // Route-interactive mode
  if (isRouteInteractive) {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg touch-none"
        style={{ cursor: selectedRouteIndex !== null && selectedRouteIndex !== undefined ? "grab" : "default" }}
        onPointerDown={handleRoutePointerDown}
        onPointerMove={handleRoutePointerMove}
        onPointerUp={handleRoutePointerUp}
        onPointerLeave={handleRoutePointerUp}
      />
    );
  }

  // Draw-interactive mode (existing)
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 rounded-lg cursor-crosshair touch-none"
      onPointerDown={(e) => handlePointerEvent(e, onMouseDown!)}
      onPointerMove={(e) => {
        if (isDrawing) handlePointerEvent(e, onMouseMove!);
      }}
      onPointerUp={() => onMouseUp!()}
      onPointerLeave={() => {
        if (isDrawing) onMouseUp!();
      }}
    />
  );
}
