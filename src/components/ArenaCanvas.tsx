"use client";

import { useRef, useEffect, useCallback } from "react";
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
}: Props) {
  const isInteractive = !!(onMouseDown && onMouseMove && onMouseUp);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    for (const path of paths) {
      if (path.points.length < 2) continue;
      drawPath(ctx, path.points, GAIT_COLORS[path.gait], path.gait === "skridt");
    }

    // Draw current path being drawn
    if (currentPath.length >= 2) {
      drawPath(ctx, currentPath, GAIT_COLORS[currentGait], currentGait === "skridt");
    }

    // Draw transition lines (gray dashed)
    if (transitions && transitions.length > 0) {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      for (const t of transitions) {
        const from = toCanvasCoords(t.from.x, t.from.y);
        const to = toCanvasCoords(t.to.x, t.to.y);
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
      ctx.font = "9px sans-serif";
      for (const lbl of labels) {
        const pos = toCanvasCoords(lbl.point.x, lbl.point.y);
        // Find matching path to get gait color
        const matchedPath = paths.find((p) => p.exerciseId === lbl.exerciseId);
        const color = matchedPath ? GAIT_COLORS[matchedPath.gait] : "#374151";

        // Measure text for background
        const textMetrics = ctx.measureText(lbl.label);
        const textW = textMetrics.width + 6;
        const textH = 14;

        // White rounded rect background
        const rx = pos.cx - textW / 2;
        const ry = pos.cy - textH / 2;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(rx, ry, textW, textH, 3);
        ctx.fill();

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
  }, [width, height, arenaW, arenaH, paths, currentPath, currentGait, toCanvasCoords, sequenceNumber, labels, transitions]);

  function drawPath(ctx: CanvasRenderingContext2D, points: PathPoint[], color: string, dashed: boolean) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
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
    ctx.arc(first.cx, first.cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // End arrow
    if (points.length >= 2) {
      const last = toCanvasCoords(points[points.length - 1].x, points[points.length - 1].y);
      ctx.beginPath();
      ctx.arc(last.cx, last.cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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

  if (!isInteractive) {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg"
      />
    );
  }

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
