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
  file: File;
  audioBuffer: AudioBuffer;
  bpm: number;
  assignedGait: string;
}

export function generateMixTimeline(
  tracks: MixTrack[],
  exercises: { gait: string; name: string }[],
  totalDurationSec: number
): MixSegment[] {
  const segments: MixSegment[] = [];
  const exerciseCount = exercises.length;
  if (exerciseCount === 0 || tracks.length === 0) return segments;

  const segmentDuration = totalDurationSec / exerciseCount;
  const crossfadeDuration = 2; // 2 second crossfades

  for (let i = 0; i < exerciseCount; i++) {
    const exercise = exercises[i];

    // Find the best matching track for this gait
    const matchingTrack = tracks.findIndex((t) => t.assignedGait === exercise.gait);
    const trackIndex = matchingTrack >= 0 ? matchingTrack : 0;

    segments.push({
      trackIndex,
      startTime: i * segmentDuration,
      endTime: (i + 1) * segmentDuration,
      fadeInDuration: i === 0 ? 0.5 : crossfadeDuration,
      fadeOutDuration: i === exerciseCount - 1 ? 1 : crossfadeDuration,
      gait: exercise.gait,
      exerciseName: exercise.name,
    });
  }

  return segments;
}

export async function renderMix(
  tracks: MixTrack[],
  segments: MixSegment[],
  totalDurationSec: number
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
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
