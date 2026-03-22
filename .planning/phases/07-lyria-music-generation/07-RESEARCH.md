# Phase 7: Lyria Music Generation - Research

**Researched:** 2026-03-22
**Domain:** Google Lyria RealTime API / Browser-based music generation
**Confidence:** MEDIUM

## Summary

Google Lyria RealTime (`lyria-realtime-exp`) is an experimental WebSocket-based streaming music generation model available through the Gemini API. It generates continuous instrumental music in real-time from text prompts with explicit BPM control (60-200 range), making it well-suited for generating dressage gait music at specific tempos. The API uses `@google/genai` npm package (v1.46.0) and connects via WebSocket to `wss://generativelanguage.googleapis.com/ws/...` using the `v1alpha` API version.

**Critical security finding:** Lyria RealTime requires a Gemini API key. Ephemeral tokens (Google's solution for client-side WebSocket security) do NOT work with Lyria RealTime -- confirmed by Google developer forum reports. This means a thin Next.js API route proxy is required to keep the API key server-side, contrary to the CONTEXT.md assumption of "client-side generation." The proxy adds minimal complexity: client sends prompt/config, server opens WebSocket to Lyria, streams PCM chunks back to client.

**Primary recommendation:** Use Lyria RealTime via a Next.js API route proxy. Collect PCM audio chunks server-side, convert to WAV, return complete audio blob to client. Use `@google/genai` SDK with `v1alpha` API version. BPM control is direct and reliable via `LiveMusicGenerationConfig.bpm` parameter.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Create `src/lib/music-provider.ts` with a `MusicProvider` interface: `generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer>`
- D-02: First implementation: `LyriaProvider` using Google Lyria RealTime API (via Gemini API)
- D-03: Provider abstraction allows swapping to Mubert, ClicknClear, or other sources later without UI changes
- D-04: Provider configured via environment variable `NEXT_PUBLIC_MUSIC_PROVIDER` (default: "lyria")
- D-05: Lyria RealTime uses Gemini API endpoint -- requires `NEXT_PUBLIC_GEMINI_API_KEY` env var
- D-06: API call runs client-side (browser) to avoid server costs -- Lyria RealTime is designed for client use
- D-07: BPM auto-set per gait from existing `bpmMatchesGait` ranges: skridt 60, trav 80, galop 100, passage 60, piaffe 60
- D-08: Generated audio format: WAV or MP3 (whatever Lyria returns) -- stored as Blob in component state
- D-09: Each gait gets one track -- total 3-5 tracks depending on level
- D-10: Global genre/mood selector at top of MusicManager
- D-11: Per-gait text prompt field for fine-tuning
- D-12: Auto-generated default prompt per gait
- D-13: User can edit the auto-generated prompt before generating
- D-14: HTML5 `<audio>` element with play/pause per gait track
- D-15: Simple waveform or progress bar showing playback position
- D-16: Volume control per track (slider)
- D-17: "Generer igen" button per gait track
- D-18: Previous track replaced (no history/undo)
- D-19: Confirmation before regeneration if track exists
- D-20: Animated spinner/pulse per gait while generating
- D-21: Estimated time indicator
- D-22: Error state with retry button
- D-23: Generate all gaits sequentially or individually
- D-24: Replace current upload-based MusicManager with generation-based UI
- D-25: Layout: genre selector at top, then one card per gait
- D-26: Keep existing MusicManager file but rewrite internals

### Claude's Discretion
- Exact Lyria API endpoint URL and request/response format (needs research)
- Whether to use Gemini SDK or raw fetch
- Audio clip duration per gait (suggest 30-60 seconds)
- Waveform visualization library vs simple progress bar
- Error retry strategy (exponential backoff vs manual retry)

### Deferred Ideas (OUT OF SCOPE)
- ClicknClear licensed music integration -- v2 (PREM-01)
- Mubert AI catalog -- v2 (PREM-02)
- Upload fallback for own files -- v2 (PREM-03)
- Music tempo matching/time-stretching
- Multi-track layering per gait

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MUS-01 | Bruger kan generere musik per gangart via Google Lyria med BPM tilpasset gangarten | Lyria RealTime supports explicit `bpm` parameter (60-200); use `LiveMusicGenerationConfig.bpm` per gait. MusicProvider abstraction wraps this. |
| MUS-02 | Bruger kan angive genre/mood/stil via tekstprompt per gangart | Lyria supports `WeightedPrompt` with text descriptions of genre, instruments, mood. Multiple prompts can blend with weights. |
| MUS-03 | Bruger kan forhoere genereret musik direkte i browseren | Lyria returns raw 16-bit PCM at 48kHz stereo; convert to WAV using existing `audioBufferToWav` pattern. Play via HTML5 `<audio>` + `URL.createObjectURL`. |
| MUS-04 | Bruger kan re-generere musik for en gangart | Open new WebSocket session per generation. Previous blob replaced in state. Confirmation dialog before replacement. |
| MUS-05 | Progress/loading UI mens musik genereres | Generation takes 5-15 seconds for ~30s of audio (collecting chunks). Show animated spinner per gait card during generation. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | 1.46.0 | Gemini API SDK with Lyria RealTime WebSocket support | Official Google SDK; provides `ai.live.music.connect()` for Lyria RealTime |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | Audio conversion | Existing `audioBufferToWav` in `audio-mixer.ts` handles PCM-to-WAV; existing Web Audio API usage covers decoding |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lyria RealTime (streaming) | Lyria 2 on Vertex AI (REST) | Lyria 2 returns complete 32.8s WAV clips via simple POST -- simpler but requires GCP project + service account, costs $0.06/30s, no BPM control in API |
| `@google/genai` SDK | Raw WebSocket | SDK handles connection management, message framing, reconnection; raw WS is more work for no benefit |
| Server proxy | Direct client-side | Ephemeral tokens do NOT work with Lyria RealTime; API key would be exposed in browser. Proxy is mandatory for security. |

**Installation:**
```bash
npm install @google/genai
```

**Version verification:** `@google/genai` v1.46.0 confirmed via npm registry 2026-03-22.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    music-provider.ts        # MusicProvider interface + factory
    lyria-provider.ts        # LyriaProvider implementation (client-side caller)
    bpm-detect.ts            # Existing BPM ranges (authoritative)
    audio-mixer.ts           # Existing MixTrack/MixSegment types
  components/
    MusicManager.tsx         # Rewritten: generation-based UI
  app/
    api/
      music/
        generate/
          route.ts           # Next.js API route proxy for Lyria RealTime
```

### Pattern 1: Server-Side Lyria Proxy (API Route)

**What:** A Next.js API route that receives prompt + config from client, opens a Lyria RealTime WebSocket session server-side, collects audio chunks, assembles WAV, and returns the complete audio blob.

**When to use:** Every music generation request.

**Why:** Ephemeral tokens do NOT work with Lyria RealTime (confirmed via Google AI developer forum). The API key must stay server-side.

**Example:**
```typescript
// src/app/api/music/generate/route.ts
// Source: https://ai.google.dev/gemini-api/docs/music-generation
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!, // Server-only, no NEXT_PUBLIC_
  httpOptions: { apiVersion: "v1alpha" },
});

export async function POST(req: Request) {
  const { prompt, bpm, durationSec } = await req.json();

  // Calculate chunks needed (~2s per chunk)
  const maxChunks = Math.ceil((durationSec || 30) / 2);
  const audioChunks: Int16Array[] = [];

  const responseQueue: any[] = [];
  const session = await ai.live.music.connect({
    model: "models/lyria-realtime-exp",
    callbacks: {
      onmessage: (message: any) => responseQueue.push(message),
      onerror: (error: any) => console.error("Lyria error:", error),
      onclose: () => {},
    },
  });

  await session.setWeightedPrompts({
    weightedPrompts: [{ text: prompt, weight: 1.0 }],
  });

  await session.setMusicGenerationConfig({
    musicGenerationConfig: { bpm, guidance: 4.0 },
  });

  session.play();

  // Collect chunks
  let collected = 0;
  while (collected < maxChunks) {
    if (responseQueue.length > 0) {
      const msg = responseQueue.shift();
      if (msg?.audioChunk?.data) {
        const buf = Buffer.from(msg.audioChunk.data, "base64");
        const int16 = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
        audioChunks.push(int16);
        collected++;
      }
    } else {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  session.close();

  // Assemble WAV from PCM chunks
  const pcmData = concatInt16Arrays(audioChunks);
  const wavBuffer = pcmToWav(pcmData, 48000, 2);

  return new Response(wavBuffer, {
    headers: { "Content-Type": "audio/wav" },
  });
}
```

### Pattern 2: MusicProvider Abstraction

**What:** Interface that decouples UI from specific music generation backend.

**When to use:** All music generation calls go through this interface.

**Example:**
```typescript
// src/lib/music-provider.ts
export interface MusicProvider {
  generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer>;
}

export function createMusicProvider(): MusicProvider {
  // Provider selection -- currently only Lyria
  return new LyriaProvider();
}
```

```typescript
// src/lib/lyria-provider.ts
import type { MusicProvider } from "./music-provider";

export class LyriaProvider implements MusicProvider {
  async generateTrack(prompt: string, bpm: number, durationSec: number): Promise<ArrayBuffer> {
    const res = await fetch("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, bpm, durationSec }),
    });
    if (!res.ok) throw new Error(`Generation failed: ${res.status}`);
    return res.arrayBuffer();
  }
}
```

### Pattern 3: Per-Gait Audio State

**What:** Component state tracks generated audio blobs per gait, with loading/error states.

**Example:**
```typescript
interface GaitTrack {
  gait: string;
  prompt: string;
  bpm: number;
  audioBlob: Blob | null;
  audioUrl: string | null;  // URL.createObjectURL
  generating: boolean;
  error: string | null;
}
```

### Anti-Patterns to Avoid
- **Exposing API key in browser:** NEVER use `NEXT_PUBLIC_GEMINI_API_KEY`. The key MUST stay server-side in the API route. Use `GEMINI_API_KEY` (no NEXT_PUBLIC_ prefix).
- **Keeping WebSocket open:** Don't maintain a persistent session across gait generations. Open a new session per track, collect chunks, close. Avoids session timeout issues (10 min max).
- **Storing AudioBuffer in state:** Store Blob + object URL instead. AudioBuffer can't be serialized for persistence (PERS-02, Phase 8).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PCM to WAV conversion | Custom WAV encoder | Adapt existing `audioBufferToWav` from `audio-mixer.ts` | Already have a working WAV encoder; just need to accept raw Int16Array instead of AudioBuffer |
| WebSocket message handling | Raw WebSocket client | `@google/genai` SDK `ai.live.music.connect()` | SDK handles framing, reconnection, message parsing |
| BPM ranges per gait | New BPM lookup table | Existing `bpmMatchesGait()` ranges in `bpm-detect.ts` | Authoritative ranges already defined: skridt 48-66, trav 72-90, galop 88-115, passage/piaffe 55-68 |
| Audio playback UI | Custom player component | HTML5 `<audio>` with native controls + styled wrapper | Sufficient for play/pause/progress; no need for wavesurfer.js |

**Key insight:** The existing codebase already has WAV encoding and BPM range logic. The main new code is the Lyria API integration (proxy route + provider) and the UI rewrite of MusicManager.

## Common Pitfalls

### Pitfall 1: API Key Exposure in Client Bundle
**What goes wrong:** Using `NEXT_PUBLIC_GEMINI_API_KEY` exposes the key in the browser JavaScript bundle. Anyone can extract it and make unlimited API calls on your account.
**Why it happens:** CONTEXT.md D-05/D-06 assumed client-side generation. Lyria RealTime doesn't support ephemeral tokens.
**How to avoid:** Use a Next.js API route at `/api/music/generate`. Store key as `GEMINI_API_KEY` (server-only). The LyriaProvider calls the local API route, not Google directly.
**Warning signs:** Any env var with `NEXT_PUBLIC_GEMINI` prefix.

### Pitfall 2: BPM Change Requires Context Reset
**What goes wrong:** Changing BPM mid-session doesn't take effect without calling `resetContext()`, which causes an audible discontinuity.
**Why it happens:** Lyria RealTime's architecture separates smooth-changing params (density, brightness) from structural params (BPM, scale) that need a reset.
**How to avoid:** Since each gait gets its own generation call (new session), this is not an issue in our architecture. Each track = new WebSocket session with correct BPM from the start.
**Warning signs:** Trying to reuse a single session across multiple gaits.

### Pitfall 3: Settling Period After Session Start
**What goes wrong:** First 5-10 seconds of audio may be unstable/settling as the model establishes a groove.
**Why it happens:** Lyria RealTime needs context to establish rhythm.
**How to avoid:** Generate slightly more audio than needed (e.g., 35s for a 30s clip) and trim the first few seconds, or accept the settling period as part of the music intro.
**Warning signs:** Users complaining that the beginning of each track sounds "weird."

### Pitfall 4: Session Timeout at 10 Minutes
**What goes wrong:** Long generation sessions silently close.
**Why it happens:** Lyria RealTime enforces a 10-minute session limit.
**How to avoid:** For 30-60 second clips, this is not an issue (~15 chunks = ~30 seconds). But don't try to generate very long tracks in one session.
**Warning signs:** WebSocket `onclose` firing unexpectedly.

### Pitfall 5: PCM Audio Format Requires Conversion
**What goes wrong:** Raw 16-bit PCM at 48kHz stereo cannot be played directly in an `<audio>` element.
**Why it happens:** Browsers need a container format (WAV, MP3) with headers.
**How to avoid:** Wrap collected PCM data in a WAV header before creating the Blob. The existing `audioBufferToWav` pattern handles this -- adapt it to accept raw Int16Array instead of AudioBuffer.
**Warning signs:** `<audio>` element shows error or plays silence.

### Pitfall 6: Instrumental Only
**What goes wrong:** Users may expect vocal music generation.
**Why it happens:** Lyria RealTime generates instrumental music only. Vocalization mode produces "oohs/aahs", not lyrics.
**How to avoid:** Document in UI that generated music is instrumental. This is fine for dressage freestyle (instrumental music is standard).
**Warning signs:** Users adding vocal-related terms in prompts.

## Code Examples

### PCM to WAV Conversion (Server-Side)
```typescript
// Source: Adapted from existing src/lib/audio-mixer.ts audioBufferToWav
function pcmToWav(pcmData: Int16Array, sampleRate: number, channels: number): ArrayBuffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = channels * bytesPerSample;
  const dataLength = pcmData.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Copy PCM data
  const int16View = new Int16Array(buffer, 44);
  int16View.set(pcmData);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
```

### Default Prompt Generation Per Gait
```typescript
// Source: CONTEXT.md D-12
const GAIT_PROMPT_TEMPLATES: Record<string, string> = {
  skridt: "roligt og majestætisk skridt-tempo",
  trav: "energisk og rytmisk trav-tempo",
  galop: "kraftfuldt og fremadrettet galop-tempo",
  passage: "ophøjet og svævende passage-tempo",
  piaffe: "samlet og kraftfuldt piaffe-tempo",
};

function buildDefaultPrompt(genre: string, gait: string, bpm: number): string {
  const gaitDesc = GAIT_PROMPT_TEMPLATES[gait] || gait;
  return `${genre} musik, ${gaitDesc}, ${bpm} BPM`;
}
```

### BPM Targets Per Gait (from existing bpm-detect.ts)
```typescript
// Source: src/lib/bpm-detect.ts bpmMatchesGait ranges
// Using midpoints of existing ranges as generation targets
const GAIT_BPM_TARGETS: Record<string, number> = {
  skridt: 57,    // range 48-66, mid=57
  trav: 81,      // range 72-90, mid=81
  galop: 102,    // range 88-115, mid=102
  passage: 62,   // range 55-68, mid=62
  piaffe: 62,    // range 55-68, mid=62
};
```
Note: CONTEXT.md D-07 suggests skridt 60, trav 80, galop 100, passage 60, piaffe 60 -- these are reasonable rounded values within the authoritative ranges.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lyria 2 (REST, Vertex AI) | Lyria RealTime (WebSocket, Gemini API) | Mid 2025 | Real-time streaming, BPM control, free tier, no GCP project needed |
| Mubert API ($49/mo) | Lyria RealTime (free experimental) | Project pivot 2026-03 | Cost reduction from $49/mo to $0 |
| Lyria RealTime only | Lyria 3 (Gemini app) | Feb 2026 | Lyria 3 is app-only, no API yet; RealTime remains the API option |

**Deprecated/outdated:**
- Lyria 2 on Vertex AI: Still available but requires GCP project, service account auth, costs $0.06/30s, and has no BPM control parameter
- Lyria 3: Currently Gemini app only (no API access), may get API in future

## Open Questions

1. **Rate limits for Lyria RealTime experimental**
   - What we know: It's experimental and free. No documented rate limits found.
   - What's unclear: Exact requests/minute or requests/day limits. Experimental models often have stricter undocumented limits.
   - Recommendation: Implement basic client-side throttling (disable generate button during active generation). Add error handling for 429 responses. Test empirically.

2. **Audio quality and BPM accuracy**
   - What we know: Lyria RealTime accepts BPM 60-200, generates at that tempo. Audio is 48kHz 16-bit stereo.
   - What's unclear: How accurately the generated BPM matches the requested BPM. Dressage music needs precise tempo.
   - Recommendation: Accept generated audio at face value for v1. Users can regenerate if tempo feels wrong. BPM detection via existing `detectBPM` could verify post-generation.

3. **CONTEXT.md D-05/D-06 conflict with security findings**
   - What we know: D-05 specifies `NEXT_PUBLIC_GEMINI_API_KEY` and D-06 specifies client-side calls. Research proves this is insecure -- ephemeral tokens don't work with Lyria RealTime.
   - What's unclear: Whether the user accepts the API route proxy approach.
   - Recommendation: **Override D-05/D-06 for security reasons.** Use `GEMINI_API_KEY` (server-only) with a Next.js API route. The MusicProvider abstraction (D-01) already hides this -- the UI doesn't know or care whether generation is client-side or server-proxied.

4. **Model stability (experimental)**
   - What we know: `lyria-realtime-exp` has the "exp" suffix indicating experimental status.
   - What's unclear: Whether the model will be removed, renamed, or rate-limited without notice.
   - Recommendation: MusicProvider abstraction (D-01/D-03) already mitigates this. If Lyria disappears, swap to another provider.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via `vitest.config.ts`) |
| Config file | `vitest.config.ts` (jsdom environment, globals, @ alias) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MUS-01 | MusicProvider.generateTrack calls API with correct BPM per gait | unit | `npx vitest run src/lib/__tests__/music-provider.test.ts -t "bpm" --reporter=verbose` | Wave 0 |
| MUS-01 | LyriaProvider sends correct request to /api/music/generate | unit | `npx vitest run src/lib/__tests__/lyria-provider.test.ts --reporter=verbose` | Wave 0 |
| MUS-02 | Default prompt includes genre + gait description + BPM | unit | `npx vitest run src/lib/__tests__/music-provider.test.ts -t "prompt" --reporter=verbose` | Wave 0 |
| MUS-03 | Generated WAV blob creates valid audio URL | unit | `npx vitest run src/lib/__tests__/music-provider.test.ts -t "audio" --reporter=verbose` | Wave 0 |
| MUS-04 | Re-generation replaces previous track in state | manual-only | Visual verification in browser | N/A |
| MUS-05 | Loading state set during generation | manual-only | Visual verification in browser | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/music-provider.test.ts` -- covers MUS-01, MUS-02, MUS-03 (provider logic, prompt building, BPM targets)
- [ ] `src/lib/__tests__/lyria-provider.test.ts` -- covers MUS-01 (fetch mock to /api/music/generate)

## Sources

### Primary (HIGH confidence)
- [Google AI Developers - Music generation using Lyria RealTime](https://ai.google.dev/gemini-api/docs/music-generation) - API docs, parameters, code examples
- [Google AI Developers - Live Music API WebSocket reference](https://ai.google.dev/api/live_music) - WebSocket protocol, message types, all parameters
- [Google AI Developers - Lyria RealTime experimental model](https://ai.google.dev/gemini-api/docs/models/lyria-realtime-exp) - Model specs, audio format
- [Google AI Developers - Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) - Confirmed: "only compatible with Live API at this time"

### Secondary (MEDIUM confidence)
- [Gemini TS Cookbook - Lyria RealTime quickstart](https://fallendeity.github.io/gemini-ts-cookbook/quickstarts/Get_started_LyriaRealtime.html) - TypeScript code examples, `@google/genai` usage patterns
- [DEV Community - Lyria RealTime Developer Guide](https://dev.to/googleai/lyria-realtime-the-developers-guide-to-infinite-music-streaming-4m1h) - Session limits (10 min), settling period, cross-fade pattern
- [Google AI Developer Forum](https://discuss.ai.google.dev/t/ephemeral-tokens-doesnt-work-with-lyria-realtime/95531) - Confirmed ephemeral tokens incompatible with Lyria RealTime

### Tertiary (LOW confidence)
- [Vertex AI Lyria 2 docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music) - Lyria 2 alternative ($0.06/30s), not recommended for this project
- [Truffle Security - Google API Keys](https://trufflesecurity.com/blog/google-api-keys-werent-secrets-but-then-gemini-changed-the-rules) - API key security risks with Gemini

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `@google/genai` is the official SDK, version confirmed via npm
- Architecture: MEDIUM - Proxy pattern is well-established but Lyria-specific WebSocket handling needs empirical validation
- Pitfalls: HIGH - Security issue (ephemeral tokens) confirmed by multiple sources; PCM format documented in official docs
- API stability: LOW - Model is experimental (`exp` suffix), may change without notice

**Research date:** 2026-03-22
**Valid until:** 2026-04-07 (7 days -- fast-moving experimental API)

---

## Discretion Recommendations

Based on CONTEXT.md "Claude's Discretion" items:

1. **Gemini SDK vs raw fetch:** Use `@google/genai` SDK. It handles WebSocket framing, message types, and reconnection. No benefit to raw WebSocket.

2. **Audio clip duration per gait:** **45 seconds.** Dressage freestyle programs are 4:30-5:30 total. With 3-5 gaits, each gait segment is roughly 45-90 seconds. Generate 45s clips; Phase 8 mix pipeline can loop them if needed (existing `renderMix` already sets `source.loop = true`).

3. **Waveform visualization:** **Simple progress bar.** A `<progress>` element or styled `<div>` showing playback position via `timeupdate` event on `<audio>`. No need for wavesurfer.js -- adds 150KB+ for minimal benefit. The existing codebase uses simple HTML elements consistently.

4. **Error retry strategy:** **Manual retry only.** Show error message with "Prøv igen" button. No automatic retry -- the user may want to edit the prompt before retrying. Keep it simple, consistent with existing error patterns (e.g., BPM detection failure in MusicManager).
