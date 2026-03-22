import { GoogleGenAI } from "@google/genai";
import { pcmToWav, concatInt16Arrays } from "@/lib/pcm-to-wav";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1alpha" },
});

export async function POST(req: Request) {
  try {
    // Validate API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { prompt, bpm, durationSec } = body as {
      prompt: string;
      bpm: number;
      durationSec: number;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return Response.json(
        { error: "prompt is required and must be a non-empty string" },
        { status: 400 },
      );
    }
    if (typeof bpm !== "number" || bpm < 60 || bpm > 200) {
      return Response.json(
        { error: "bpm must be a number between 60 and 200" },
        { status: 400 },
      );
    }
    if (typeof durationSec !== "number" || durationSec < 10 || durationSec > 120) {
      return Response.json(
        { error: "durationSec must be a number between 10 and 120" },
        { status: 400 },
      );
    }

    // Generate 5 extra seconds to handle settling period (Pitfall 3 from research)
    const actualDuration = durationSec + 5;
    const maxChunks = Math.ceil(actualDuration / 2); // Each chunk is ~2s of audio

    // Open Lyria RealTime WebSocket session
    const audioChunks: Int16Array[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseQueue: any[] = [];
    let sessionClosed = false;

    const session = await ai.live.music.connect({
      model: "models/lyria-realtime-exp",
      callbacks: {
        onmessage: (msg: unknown) => responseQueue.push(msg),
        onerror: (err: unknown) => console.error("Lyria error:", err),
        onclose: () => { sessionClosed = true; },
      },
    });

    // Set prompt and BPM config
    await session.setWeightedPrompts({
      weightedPrompts: [{ text: prompt, weight: 1.0 }],
    });
    await session.setMusicGenerationConfig({
      musicGenerationConfig: { bpm, guidance: 4.0 },
    });

    // Start playback
    session.play();

    // Collect audio chunks with 30-second timeout safety
    let collected = 0;
    const startTime = Date.now();
    const timeoutMs = 30000;

    while (collected < maxChunks && !sessionClosed) {
      if (Date.now() - startTime > timeoutMs) {
        console.error("Lyria timeout: exceeded 30 seconds of collection");
        break;
      }

      if (responseQueue.length > 0) {
        const msg = responseQueue.shift();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioData = (msg as any)?.audioChunk?.data;
        if (audioData) {
          const buf = Buffer.from(audioData, "base64");
          const int16 = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
          audioChunks.push(int16);
          collected++;
        }
      } else {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    // Close session
    session.close();

    if (audioChunks.length === 0) {
      return Response.json(
        { error: "No audio data received from Lyria" },
        { status: 500 },
      );
    }

    // Assemble WAV: concatenate chunks, trim first 5 seconds (settling period)
    const pcmData = concatInt16Arrays(audioChunks);
    const trimSamples = 5 * 48000 * 2; // 5 seconds * 48kHz * 2 channels
    const trimmedPcm = pcmData.length > trimSamples
      ? pcmData.slice(trimSamples)
      : pcmData;

    const wavBuffer = pcmToWav(trimmedPcm, 48000, 2);

    return new Response(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wavBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("Music generation error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
