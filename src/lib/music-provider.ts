export interface MusicProvider {
  generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer>;
}

export type ProviderType = "suno" | "lyria";

export function createMusicProvider(type: ProviderType = "suno"): MusicProvider {
  if (type === "lyria") {
    const { LyriaProvider } = require("./lyria-provider");
    return new LyriaProvider();
  }
  // Default: Suno (supports vocals + instrumentals)
  const { SunoProvider } = require("./suno-provider");
  return new SunoProvider();
}
