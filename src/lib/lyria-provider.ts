import type { MusicProvider, GenerateOptions } from "./music-provider";

export class LyriaProvider implements MusicProvider {
  async generateTrack(options: GenerateOptions): Promise<ArrayBuffer> {
    const res = await fetch("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.style,
        bpm: options.bpm,
        durationSec: options.durationSec,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Music generation failed (${res.status}): ${text}`);
    }
    return res.arrayBuffer();
  }
}
