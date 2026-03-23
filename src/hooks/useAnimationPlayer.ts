"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getPositionAtTime, getTotalDuration } from "@/lib/animation-timeline";
import type { AnimationSegment, MarkerState } from "@/lib/animation-timeline";

interface AnimationPlayerState {
  marker: MarkerState | null;
  playing: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * React hook that drives animation playback via requestAnimationFrame.
 * Per D-15: Internal state: currentTime, playing, speed.
 * Per D-16: Exposes play/pause/seek/setSpeed controls.
 * Per D-17: rAF loop advances currentTime when playing.
 * Per D-18: API designed for Phase 10 music sync via seek().
 */
export function useAnimationPlayer(timeline: AnimationSegment[]): AnimationPlayerState {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeedState] = useState(1);

  // Refs for rAF loop to avoid stale closures
  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const currentTimeRef = useRef(0);

  const totalDuration = useMemo(() => getTotalDuration(timeline), [timeline]);

  // Keep refs in sync with state
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Compute marker position from currentTime + timeline
  const marker = useMemo(
    () => getPositionAtTime(timeline, currentTime),
    [timeline, currentTime],
  );

  // rAF loop
  const tick = useCallback((timestamp: number) => {
    if (!playingRef.current) {
      lastTimestampRef.current = null;
      return;
    }

    if (lastTimestampRef.current !== null) {
      const deltaMs = timestamp - lastTimestampRef.current;
      const deltaSec = (deltaMs / 1000) * speedRef.current;
      const newTime = currentTimeRef.current + deltaSec;

      // Get total duration from timeline (use ref-safe approach)
      const totalDur = getTotalDuration(timeline);

      if (newTime >= totalDur) {
        // Auto-pause and reset at end (D-17)
        setCurrentTime(0);
        currentTimeRef.current = 0;
        setPlaying(false);
        playingRef.current = false;
        lastTimestampRef.current = null;
        return;
      }

      setCurrentTime(newTime);
      currentTimeRef.current = newTime;
    }

    lastTimestampRef.current = timestamp;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [timeline]);

  // Start/stop rAF loop based on playing state
  useEffect(() => {
    if (playing) {
      lastTimestampRef.current = null;
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimestampRef.current = null;
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [playing, tick]);

  const play = useCallback(() => {
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(time, getTotalDuration(timeline)));
    setCurrentTime(clamped);
    currentTimeRef.current = clamped;
  }, [timeline]);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    speedRef.current = s;
  }, []);

  return {
    marker,
    playing,
    currentTime,
    totalDuration,
    speed,
    play,
    pause,
    seek,
    setSpeed,
  };
}
