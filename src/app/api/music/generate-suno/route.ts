import { NextResponse } from "next/server";

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_URL = "https://api.sunoapi.org/api/v1/generate";
const SUNO_STATUS_URL = "https://api.sunoapi.org/api/v1/generate/record-info";

// Suno requires a callBackUrl but we poll instead — use a dummy placeholder
const CALLBACK_PLACEHOLDER = "https://example.com/callback";

export const maxDuration = 120; // Allow up to 2 minutes for generation + polling

export async function POST(request: Request) {
  if (!SUNO_API_KEY) {
    return NextResponse.json(
      { error: "SUNO_API_KEY ikke konfigureret. Tilføj den til .env.local" },
      { status: 500 }
    );
  }

  const { prompt, bpm } = await request.json();

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
        callBackUrl: CALLBACK_PLACEHOLDER,
      }),
    });

    if (!generateRes.ok) {
      const text = await generateRes.text().catch(() => "");
      console.error("[suno] Generate error:", generateRes.status, text);
      return NextResponse.json(
        { error: `Suno API fejl (${generateRes.status}): ${text}` },
        { status: generateRes.status }
      );
    }

    const generateData = await generateRes.json();
    const taskId = generateData.data?.taskId;

    if (!taskId) {
      console.error("[suno] No taskId in response:", JSON.stringify(generateData));
      return NextResponse.json(
        { error: "Intet taskId returneret fra Suno API" },
        { status: 500 }
      );
    }

    console.log("[suno] Task submitted:", taskId);

    // Step 2: Poll for completion using record-info endpoint
    const maxAttempts = 40;
    const pollInterval = 3000; // 3 seconds — total max ~2 minutes

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(
        `${SUNO_STATUS_URL}?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const status = statusData.data?.status;
      const sunoData = statusData.data?.response?.sunoData;

      // Check for terminal error states
      if (status === "CREATE_TASK_FAILED" || status === "GENERATE_AUDIO_FAILED") {
        console.error("[suno] Generation failed:", status);
        return NextResponse.json(
          { error: `Musikgenerering fejlede: ${status}` },
          { status: 500 }
        );
      }

      // Look for completed tracks with audio URL
      if (sunoData && Array.isArray(sunoData) && sunoData.length > 0) {
        const readyTrack = sunoData.find(
          (t: { audioUrl?: string; streamAudioUrl?: string }) =>
            t.audioUrl || t.streamAudioUrl
        );

        if (readyTrack) {
          const audioUrl = readyTrack.audioUrl || readyTrack.streamAudioUrl;
          console.log("[suno] Track ready:", audioUrl);

          // Fetch the audio file and return it
          const audioRes = await fetch(audioUrl);
          if (!audioRes.ok) {
            return NextResponse.json(
              { error: "Kunne ikke downloade genereret musik" },
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

      console.log(`[suno] Polling attempt ${attempt + 1}/${maxAttempts}, status: ${status}`);
    }

    return NextResponse.json(
      { error: "Musikgenerering timeout efter 2 minutter" },
      { status: 504 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[suno] Error:", message);
    return NextResponse.json(
      { error: `Suno fejl: ${message}` },
      { status: 500 }
    );
  }
}
