import { NextResponse } from "next/server";

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_URL = "https://api.sunoapi.org/api/v1/generate";

export async function POST(request: Request) {
  if (!SUNO_API_KEY) {
    return NextResponse.json(
      { error: "SUNO_API_KEY not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  const { prompt, bpm, durationSec } = await request.json();

  // Build style tag with BPM hint
  const style = `${prompt}, ${bpm} BPM`;

  try {
    // Step 1: Submit generation request
    const generateRes = await fetch(SUNO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        style,
        title: `Kür ${bpm} BPM`,
        prompt: prompt,
        model: "V5",
        callBackUrl: "", // We poll instead of using callback
      }),
    });

    if (!generateRes.ok) {
      const text = await generateRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Suno API error (${generateRes.status}): ${text}` },
        { status: generateRes.status }
      );
    }

    const generateData = await generateRes.json();
    const taskId = generateData.data?.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: "No taskId returned from Suno API" },
        { status: 500 }
      );
    }

    // Step 2: Poll for completion (stream URL ready in ~30-40s)
    const maxAttempts = 30;
    const pollInterval = 3000; // 3 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(
        `https://api.sunoapi.org/api/v1/task/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const tracks = statusData.data?.tracks || statusData.data?.data || [];

      // Look for a completed track with audio URL
      const readyTrack = Array.isArray(tracks)
        ? tracks.find(
            (t: { stream_audio_url?: string; audio_url?: string }) =>
              t.stream_audio_url || t.audio_url
          )
        : null;

      if (readyTrack) {
        const audioUrl = readyTrack.stream_audio_url || readyTrack.audio_url;

        // Fetch the audio file and return it
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
          return NextResponse.json(
            { error: "Failed to download generated audio" },
            { status: 500 }
          );
        }

        const audioBuffer = await audioRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Music generation timed out after 90 seconds" },
      { status: 504 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Suno generation error: ${message}` },
      { status: 500 }
    );
  }
}
