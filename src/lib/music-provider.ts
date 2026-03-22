export interface MusicProvider {
  generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer>;
}

export function createMusicProvider(): MusicProvider {
  // Currently only Lyria — MusicProvider abstraction allows future swap (D-03)
  // Dynamic import to avoid circular deps and allow tree-shaking
  const { LyriaProvider } = require("./lyria-provider");
  return new LyriaProvider();
}
