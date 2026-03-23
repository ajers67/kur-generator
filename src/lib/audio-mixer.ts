import type { GaitDuration } from "@/lib/gait-duration";

export interface MixSegment {
  trackIndex: number;
  startTime: number;
  endTime: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  gait: string;
  exerciseName: string;
}

export interface MixTrack {
  audioBlob: Blob;
  audioBuffer: AudioBuffer;
  bpm: number;
  assignedGait: string;
}

export function generateMixTimeline(
  tracks: MixTrack[],
  exercises: { gait: string; name: string; coefficient: number }[],
  gaitDurations: GaitDuration[],
): MixSegment[] {
  const segments: MixSegment[] = [];
  if (exercises.length === 0 || tracks.length === 0) return segments;

  // Build a map of gait -> duration per exercise within that gait
  const gaitDurationMap = new Map<string, number>();
  for (const gd of gaitDurations) {
    if (gd.exerciseCount > 0) {
      gaitDurationMap.set(gd.gait, gd.durationSec / gd.exerciseCount);
    }
  }

  const crossfadeDuration = 2; // 2 second crossfades at gait changes
  let currentTime = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const prevExercise = i > 0 ? exercises[i - 1] : null;
    const isGaitChange = prevExercise !== null && prevExercise.gait !== exercise.gait;
    const isFirst = i === 0;
    const isLast = i === exercises.length - 1;

    // Find matching track for this gait
    const matchingTrack = tracks.findIndex((t) => t.assignedGait === exercise.gait);
    const trackIndex = matchingTrack >= 0 ? matchingTrack : 0;

    // Duration for this exercise from coefficient-weighted gait durations
    const exerciseDuration = gaitDurationMap.get(exercise.gait) || 30;

    // Determine fade durations per D-03 and D-04
    let fadeInDuration: number;
    let fadeOutDuration: number;

    if (isFirst) {
      fadeInDuration = 0.5; // Gentle start
    } else if (isGaitChange) {
      fadeInDuration = crossfadeDuration; // Crossfade at gait change
      // Pull start back by crossfade duration for overlap
      currentTime -= crossfadeDuration;
    } else {
      fadeInDuration = 0; // Seamless within same gait
    }

    const startTime = currentTime;
    const endTime = startTime + exerciseDuration;

    // Check next exercise to determine fadeOut
    const nextExercise = i < exercises.length - 1 ? exercises[i + 1] : null;
    const isNextGaitChange = nextExercise !== null && nextExercise.gait !== exercise.gait;

    if (isLast) {
      fadeOutDuration = 1.0; // Gentle end
    } else if (isNextGaitChange) {
      fadeOutDuration = crossfadeDuration; // Crossfade at gait change
    } else {
      fadeOutDuration = 0; // Seamless within same gait
    }

    segments.push({
      trackIndex,
      startTime,
      endTime,
      fadeInDuration,
      fadeOutDuration,
      gait: exercise.gait,
      exerciseName: exercise.name,
    });

    currentTime = endTime;
  }

  return segments;
}

export async function renderMix(
  tracks: MixTrack[],
  segments: MixSegment[],
  totalDurationSec: number,
): Promise<AudioBuffer> {
  if (segments.length === 0 || tracks.length === 0) {
    throw new Error("No segments or tracks to mix");
  }

  const sampleRate = tracks[0].audioBuffer.sampleRate;
  const channels = tracks[0].audioBuffer.numberOfChannels;
  const totalSamples = Math.ceil(totalDurationSec * sampleRate);

  const offlineCtx = new OfflineAudioContext(channels, totalSamples, sampleRate);

  for (const segment of segments) {
    const track = tracks[segment.trackIndex];
    if (!track) continue;

    const source = offlineCtx.createBufferSource();
    source.buffer = track.audioBuffer;
    source.loop = true; // Loop if track is shorter than segment

    // Create gain node for fading
    const gainNode = offlineCtx.createGain();
    const segStart = segment.startTime;
    const segEnd = segment.endTime;

    // Fade in
    gainNode.gain.setValueAtTime(0, segStart);
    gainNode.gain.linearRampToValueAtTime(1, segStart + segment.fadeInDuration);

    // Sustain
    gainNode.gain.setValueAtTime(1, segEnd - segment.fadeOutDuration);

    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, segEnd);

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    source.start(segStart);
    source.stop(segEnd + 0.1);
  }

  return offlineCtx.startRendering();
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleave channel data
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function decodeBlobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
