import type { MusicProvider } from "./music-provider";

export class LyriaProvider implements MusicProvider {
  async generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer> {
    const res = await fetch("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, bpm, durationSec }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Music generation failed (${res.status}): ${text}`);
    }
    return res.arrayBuffer();
  }
}
