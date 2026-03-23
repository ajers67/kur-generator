import type { MusicProvider, GenerateOptions } from "./music-provider";

export class SunoProvider implements MusicProvider {
  async generateTrack(options: GenerateOptions): Promise<ArrayBuffer> {
    const res = await fetch("/api/music/generate-suno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        style: options.style,
        lyrics: options.lyrics,
        bpm: options.bpm,
        durationSec: options.durationSec,
        instrumental: options.instrumental,
        language: options.language,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Suno music generation failed (${res.status}): ${text}`);
    }
    return res.arrayBuffer();
  }
}
