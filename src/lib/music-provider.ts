export interface GenerateOptions {
  style: string;        // Genre/mood description (Suno "style" field)
  lyrics: string;       // Song lyrics (Suno "prompt" field) — empty = instrumental
  bpm: number;
  durationSec: number;
  instrumental: boolean; // true = no vocals
  language: string;     // "da", "en", "instrumental"
}

export interface MusicProvider {
  generateTrack(options: GenerateOptions): Promise<ArrayBuffer>;
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
