"use client";

import { useRef, useEffect } from "react";
import { GAIT_COLORS } from "@/data/kur-levels";
import type { ArenaPath } from "@/components/ArenaCanvas";

interface Props {
  paths: ArenaPath[];
  width?: number;
  height?: number;
}

export function ArenaThumbnail({ paths, width = 120, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pad = 8;
    const arenaW = width - pad * 2;
    const arenaH = height - pad * 2;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Gray border rect for arena
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, arenaW, arenaH);

    // Draw paths
    for (const path of paths) {
      if (path.points.length < 2) continue;

      ctx.strokeStyle = GAIT_COLORS[path.gait];
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([]);

      ctx.beginPath();
      const first = path.points[0];
      ctx.moveTo(pad + first.x * arenaW, pad + first.y * arenaH);

      for (let i = 1; i < path.points.length; i++) {
        const p = path.points[i];
        ctx.lineTo(pad + p.x * arenaW, pad + p.y * arenaH);
      }
      ctx.stroke();
    }
  }, [paths, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded border border-gray-100"
    />
  );
}
