export async function detectBPM(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Use web-audio-beat-detector
  const { guess } = await import("web-audio-beat-detector");
  const { bpm } = await guess(audioBuffer);

  await audioContext.close();
  return Math.round(bpm);
}

export function bpmMatchesGait(
  bpm: number,
  gait: string
): { match: boolean; ideal: string; diff: number } {
  // BPM ranges per gait (counting one front leg)
  const ranges: Record<string, { min: number; max: number; label: string }> = {
    skridt: { min: 48, max: 66, label: "48-66 BPM" },
    trav: { min: 72, max: 90, label: "72-90 BPM" },
    galop: { min: 88, max: 115, label: "88-115 BPM" },
    passage: { min: 55, max: 68, label: "55-68 BPM" },
    piaffe: { min: 55, max: 68, label: "55-68 BPM" },
  };

  const range = ranges[gait];
  if (!range) return { match: true, ideal: "N/A", diff: 0 };

  const mid = (range.min + range.max) / 2;
  const diff = Math.abs(bpm - mid);

  // Check if BPM is within range (with some tolerance for half-time/double-time)
  const inRange = bpm >= range.min - 5 && bpm <= range.max + 5;
  const halfTime = bpm * 2 >= range.min - 5 && bpm * 2 <= range.max + 5;
  const doubleTime = bpm / 2 >= range.min - 5 && bpm / 2 <= range.max + 5;

  return {
    match: inRange || halfTime || doubleTime,
    ideal: range.label,
    diff: inRange ? diff : halfTime ? Math.abs(bpm * 2 - mid) : Math.abs(bpm / 2 - mid),
  };
}
