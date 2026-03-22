import { describe, it, expect } from "vitest";
import { pcmToWav, concatInt16Arrays } from "../pcm-to-wav";

describe("concatInt16Arrays", () => {
  it("concatenates multiple Int16Array chunks", () => {
    const a = new Int16Array([1, 2, 3]);
    const b = new Int16Array([4, 5]);
    const c = new Int16Array([6]);
    const result = concatInt16Arrays([a, b, c]);
    expect(result).toEqual(new Int16Array([1, 2, 3, 4, 5, 6]));
  });

  it("returns empty array for empty input", () => {
    const result = concatInt16Arrays([]);
    expect(result.length).toBe(0);
  });

  it("handles single array", () => {
    const a = new Int16Array([10, 20]);
    const result = concatInt16Arrays([a]);
    expect(result).toEqual(new Int16Array([10, 20]));
  });
});

describe("pcmToWav", () => {
  const sampleRate = 48000;
  const channels = 2;
  const pcm = new Int16Array([100, -100, 200, -200]); // 2 stereo samples

  it("produces correct RIFF header", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    const view = new DataView(wav);

    // "RIFF" at offset 0
    const riff = String.fromCharCode(
      view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3),
    );
    expect(riff).toBe("RIFF");

    // "WAVE" at offset 8
    const wave = String.fromCharCode(
      view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11),
    );
    expect(wave).toBe("WAVE");
  });

  it("has correct file size in RIFF header", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    const view = new DataView(wav);
    const fileSize = view.getUint32(4, true);
    expect(fileSize).toBe(wav.byteLength - 8);
  });

  it("has correct fmt chunk with PCM format", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    const view = new DataView(wav);

    // fmt chunk ID
    const fmt = String.fromCharCode(
      view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15),
    );
    expect(fmt).toBe("fmt ");

    // fmt chunk size
    expect(view.getUint32(16, true)).toBe(16);

    // PCM format = 1
    expect(view.getUint16(20, true)).toBe(1);

    // Channels
    expect(view.getUint16(22, true)).toBe(channels);

    // Sample rate
    expect(view.getUint32(24, true)).toBe(sampleRate);

    // Byte rate = sampleRate * blockAlign
    const blockAlign = channels * 2;
    expect(view.getUint32(28, true)).toBe(sampleRate * blockAlign);

    // Block align
    expect(view.getUint16(32, true)).toBe(blockAlign);

    // Bits per sample
    expect(view.getUint16(34, true)).toBe(16);
  });

  it("has correct data chunk length matching input PCM", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    const view = new DataView(wav);

    // "data" chunk ID
    const data = String.fromCharCode(
      view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39),
    );
    expect(data).toBe("data");

    // Data length = pcm.length * 2 (bytes per sample)
    const dataLength = view.getUint32(40, true);
    expect(dataLength).toBe(pcm.length * 2);
  });

  it("total WAV size equals header (44) + PCM data bytes", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    expect(wav.byteLength).toBe(44 + pcm.length * 2);
  });

  it("preserves PCM sample values in WAV body", () => {
    const wav = pcmToWav(pcm, sampleRate, channels);
    const view = new DataView(wav);
    expect(view.getInt16(44, true)).toBe(100);
    expect(view.getInt16(46, true)).toBe(-100);
    expect(view.getInt16(48, true)).toBe(200);
    expect(view.getInt16(50, true)).toBe(-200);
  });
});
