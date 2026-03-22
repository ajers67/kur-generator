/**
 * Concatenates multiple Int16Array chunks into a single Int16Array.
 */
export function concatInt16Arrays(arrays: Int16Array[]): Int16Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Int16Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Wraps raw PCM Int16Array data in a WAV container with a 44-byte RIFF header.
 * Lyria RealTime outputs 48kHz 16-bit stereo PCM.
 */
export function pcmToWav(pcmData: Int16Array, sampleRate: number, channels: number): ArrayBuffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = channels * bytesPerSample;
  const dataLength = pcmData.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Copy PCM samples into WAV body
  const int16View = new Int16Array(buffer, headerLength);
  int16View.set(pcmData);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
