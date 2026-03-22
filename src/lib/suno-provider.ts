import type { MusicProvider } from "./music-provider";

export class SunoProvider implements MusicProvider {
  async generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer> {
    const res = await fetch("/api/music/generate-suno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, bpm, durationSec }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Suno music generation failed (${res.status}): ${text}`);
    }
    return res.arrayBuffer();
  }
}
