# Pitfalls Research

**Domain:** Third-party music API integration (Mubert) in a browser-based dressage kur planning app
**Researched:** 2026-03-20
**Confidence:** HIGH (Web Audio API, localStorage), MEDIUM (Mubert API specifics -- docs are gated behind paid access)

## Critical Pitfalls

### Pitfall 1: Mubert "Free Tier" Does Not Exist for the API

**What goes wrong:**
The PROJECT.md states "Mubert free tier har begraensninger (25 tracks, 30 min/dag generering)." This appears to reference the Mubert Render consumer product, NOT the API. The Mubert API starts at $49/month (Trial Plan). There is no free API tier. Building an integration against an API you cannot actually call without payment will stall development immediately.

**Why it happens:**
Mubert markets "Render" (consumer product with 25 free tracks/month) and "API" (developer product, paid only) under the same brand. It is easy to confuse the two. The 25-track limit is the Render web UI, not an API endpoint.

**How to avoid:**
1. Before writing any Mubert integration code, sign up for the $49/mo Trial Plan and obtain actual `company-id` and `license-token` credentials.
2. Alternatively, design the music integration layer as an abstraction so Mubert can be swapped for the curated music library endpoint (`/music-library/tracks`) which searches pre-made tracks by BPM/genre -- this may be available on the trial plan and avoids the generative AI track limits.
3. Budget the $49/mo during development. If unacceptable, pivot to a different API or build a mock-first architecture.

**Warning signs:**
- No API credentials in environment after "setting up Mubert"
- Using Mubert Render URLs (`mubert.com/render/`) instead of API URLs (`music-api.mubert.com/`)
- Hardcoded example responses instead of real API calls

**Phase to address:**
Phase 1 (API foundation). This must be validated before any code is written.

---

### Pitfall 2: Calling Mubert API Directly from the Browser (CORS)

**What goes wrong:**
The app is currently client-only (no backend). The Mubert API at `music-api.mubert.com` almost certainly does not set `Access-Control-Allow-Origin` headers for arbitrary origins. Direct browser fetch calls will fail with CORS errors. Worse, calling the API from the client exposes `company-id` and `license-token` in browser DevTools, which is a security violation of Mubert's ToS.

**Why it happens:**
The project constraint says "al logik koerer i browseren" (all logic runs in the browser). Developers try to maintain this constraint and call the API directly from React, hitting CORS walls.

**How to avoid:**
Accept that a minimal server-side proxy is required. Options ranked by simplicity:
1. **Next.js API Route** -- the app already runs Next.js 16. Add `/app/api/mubert/route.ts` as a thin proxy. Credentials stay server-side. Zero additional infrastructure.
2. **Vercel Edge Function** -- if deploying to Vercel, same concept but at the edge.
3. **Cloudflare Worker** -- if not using Vercel.

The proxy is 20-30 lines of code. Do NOT use a public CORS proxy (corsproxy.io etc.) -- these are unreliable, have their own rate limits, and expose your credentials.

**Warning signs:**
- `TypeError: Failed to fetch` or CORS errors in the console
- API keys visible in browser network tab
- Discussion of "disabling CORS" in development

**Phase to address:**
Phase 1 (API foundation). The proxy route must be the first thing built.

---

### Pitfall 3: AudioContext Suspended State (Autoplay Policy)

**What goes wrong:**
Creating an `AudioContext` before the user has interacted with the page (clicked, tapped) results in a suspended context. Any call to `audioContext.decodeAudioData()` or playback will silently fail or throw. The existing `MusicManager` already creates AudioContexts for file upload -- but the new preview/playback feature for Mubert tracks will hit this harder because users expect to click "preview" and hear audio immediately.

**Why it happens:**
Chrome, Safari, and Firefox all enforce autoplay policies. An `AudioContext` created without a preceding user gesture starts in `"suspended"` state. Developers test in environments where the browser has already received a gesture (e.g., clicking the address bar counts in some browsers during development), so it works locally but breaks in production.

**How to avoid:**
1. Create a single shared `AudioContext` lazily, on the FIRST user-initiated audio action (play button click, not page load).
2. Always check `audioContext.state === "suspended"` and call `audioContext.resume()` inside the click handler.
3. Use an `<audio>` element with `src` attribute for simple preview playback (Mubert returns MP3 URLs). `<audio>` elements with a play button do not require AudioContext at all.
4. Reserve `AudioContext` / `OfflineAudioContext` for the mix-rendering step only.

**Warning signs:**
- Audio works on developer machine but not on first visit
- `audioContext.state` is `"suspended"` when checked
- No error thrown -- just silence

**Phase to address:**
Phase 2 (preview/playback). Must be handled when building the track preview UI.

---

### Pitfall 4: Mubert Track Generation is Asynchronous, Not Instant

**What goes wrong:**
Developers build the UI as if calling the Mubert generate endpoint returns a track URL immediately. In reality, AI track generation takes seconds (the blog mentions ~3 seconds buffering), and Mubert uses webhooks to notify when generation completes. If the UI shows a spinner and makes a synchronous-looking request, it may time out, or the user may click away thinking it is broken.

**Why it happens:**
REST APIs are assumed to be request-response. Mubert's generation endpoint starts a job and returns a session ID; the track URL comes via webhook or polling.

**How to avoid:**
1. Design the UI for async generation from the start: show "Generating..." state with progress indication.
2. Use the music library search endpoint (`/music-library/tracks`) for instant BPM/genre browsing -- this returns pre-existing tracks immediately and does not consume generation quota.
3. Reserve AI generation for "custom track" scenarios where the library does not have a good BPM match.
4. Implement a webhook receiver in the Next.js API route, or fall back to polling the track status endpoint.

**Warning signs:**
- UI freezes or shows infinite spinner when generating
- Network requests timing out
- Using `await fetch(generateEndpoint)` and expecting a track URL in the response body

**Phase to address:**
Phase 1 (API foundation) for the async pattern; Phase 2 (UI) for the loading states.

---

### Pitfall 5: Storing Audio Data in localStorage

**What goes wrong:**
localStorage is limited to ~5 MB per origin (string data only). A single 3-minute MP3 at 128kbps is ~2.8 MB. Base64-encoding it for localStorage adds 33% overhead, making it ~3.7 MB. Two tracks exceed the quota. The app needs to persist music selections across page refreshes, and developers instinctively reach for localStorage since the project already plans to use it for wizard state.

**Why it happens:**
localStorage is the simplest persistence API. The PROJECT.md explicitly says "localStorage til persistens." Developers store everything in one place without considering that wizard form state (a few KB) and audio blobs (multiple MB) have wildly different storage requirements.

**How to avoid:**
1. Use localStorage ONLY for wizard state (level, horse profile, ratings, program order, music selections as metadata). This is a few KB at most.
2. Use IndexedDB for audio blob storage. IndexedDB can store binary Blobs natively (no Base64 encoding needed) and has access to up to 50% of available disk space.
3. Store Mubert track URLs in localStorage (they are just strings). Only cache the actual audio data in IndexedDB if offline playback is needed.
4. Use a thin abstraction like `idb-keyval` (1KB library) to avoid the verbose IndexedDB API.

**Warning signs:**
- `QuotaExceededError` in console
- `try/catch` around `localStorage.setItem` catching errors
- Base64-encoded audio strings in localStorage
- App data disappears silently when quota is exceeded (some browsers evict localStorage silently in private browsing)

**Phase to address:**
Phase 1 (persistence architecture). The storage strategy must be decided before any persistence code is written.

---

### Pitfall 6: Wasting Mubert Generation Quota on Exploration

**What goes wrong:**
The Trial Plan has limited track generations. Users exploring the app ("let me try jazz... no, classical... actually pop") burn through quota rapidly. With no guardrails, a single user session could exhaust the monthly allocation.

**Why it happens:**
The UI makes generation feel "free" to the user. Each click of "Generate" costs a quota unit, but the user does not see this cost.

**How to avoid:**
1. Default the UI to the **music library search** (pre-existing tracks), not AI generation. Library searches are likely unlimited or much less restricted.
2. Show the user how many generations remain: "3 af 25 generationer brugt denne maaned."
3. Add a confirmation step before generating: "Generer et unikt nummer? Du har X generationer tilbage."
4. Cache generated tracks in IndexedDB so re-visiting does not re-generate.
5. Allow the user to preview library tracks freely, and only use generation when they cannot find a BPM match.

**Warning signs:**
- "Generate" is the primary/default action in the music UI
- No counter or limit display
- Users reporting "no more music" errors
- API returning 429 or quota-exceeded responses

**Phase to address:**
Phase 2 (music selection UI). The UX flow must guide users toward library browsing first.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded Mubert credentials in source | Quick setup | Security breach, credential revocation | Never -- use env variables from day one |
| Storing audio as Base64 in localStorage | Simple persistence | 5MB quota hit, app crashes | Never -- use IndexedDB for binary data |
| Single AudioContext for everything | Less code | Suspended state bugs, context limits (6 per page in some browsers) | Only if lazily created and properly resumed |
| Polling instead of webhooks for track generation | No webhook endpoint needed | Wasted API calls, slower UX | Acceptable in Phase 1 prototype, replace with webhooks in Phase 2 |
| Mocking Mubert API in development | No $49/mo cost during dev | Integration bugs discovered late | Acceptable if mock matches real API schema exactly |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Mubert API | Calling from browser (CORS failure + credential exposure) | Next.js API route proxy (`/app/api/mubert/route.ts`) |
| Mubert API | Treating generation as synchronous | Implement async flow: request -> poll/webhook -> retrieve URL |
| Mubert API | Not distinguishing "Render" (consumer) from "API" (developer) product | Verify you have API credentials (`company-id`, `license-token`), not a Render account |
| Mubert API | Ignoring the music library endpoint | Use `/music-library/tracks` for instant BPM/genre search; reserve generation for custom needs |
| Web Audio API | Creating AudioContext on page load | Create on first user gesture; check and resume suspended contexts |
| Web Audio API | Using AudioContext for simple preview playback | Use `<audio>` element for MP3 URL preview; reserve AudioContext for mixing |
| IndexedDB | Storing audio in localStorage instead | Use IndexedDB for blobs, localStorage for metadata only |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Decoding audio twice (existing bug) | Slow file uploads, doubled memory usage | Pass pre-decoded `AudioBuffer` to BPM detection instead of re-reading File | Files over 10 MB |
| WAV encoding on main thread (existing bug) | UI freezes during mix render for 2-5 seconds | Move `audioBufferToWav` to a Web Worker | Mixes over 3 minutes |
| Downloading full Mubert tracks for preview | Slow previews, wasted bandwidth | Use streaming endpoint or request short preview clips (30s) | Users on mobile/slow connections |
| Re-fetching Mubert tracks on every page visit | Slow load, wasted API calls, possible rate limit hits | Cache track audio in IndexedDB, cache metadata in localStorage | After 5+ tracks selected |
| Multiple AudioContext instances | Browser limit (6 contexts in some browsers), memory leaks | Singleton AudioContext created on first use, reused everywhere | When user previews multiple tracks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Mubert API credentials in client-side code | Credential theft via DevTools, ToS violation, account termination | Server-side proxy only; credentials in environment variables |
| No file size validation on uploads | Browser tab crash from 500MB+ file decoded in memory | Reject files over 50 MB before `decodeAudioData` |
| Trusting MIME type for audio validation | Malformed binary passed to AudioContext | Defense in depth: check MIME type AND catch `decodeAudioData` errors with user-visible message (partially done already) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback during track generation | User clicks "Generate" repeatedly, burning quota | Show generation state with estimated time; disable button during generation |
| Silent mix failures (existing bug) | User thinks mix is ready but nothing happened | Show error toast/alert when `renderMix` fails; existing catch block only logs to console |
| BPM mismatch between selected music and gait | Kur sounds wrong -- walk music at galop tempo | Pre-filter/suggest BPM ranges per gait: walk 60-80, trot 130-160, canter 90-110 |
| Losing all work on page refresh (existing) | Riders lose 30+ minutes of kur planning | Implement persistence in Phase 1 before adding any new features |
| No undo for track selection | User accidentally replaces carefully chosen track | Store previous selection; allow "revert" |
| Unclear generation quota status | User runs out of generations mid-session with no warning | Prominent quota counter in music UI |

## "Looks Done But Isn't" Checklist

- [ ] **Mubert integration:** Often missing webhook/polling for async generation -- verify tracks are actually playable, not just requested
- [ ] **Audio preview:** Often missing AudioContext resume on user gesture -- verify preview works in a fresh incognito window with no prior interaction
- [ ] **localStorage persistence:** Often missing error handling for QuotaExceededError -- verify app behavior when storage is full
- [ ] **localStorage persistence:** Often missing private browsing mode handling -- verify app works in Safari Private mode (localStorage may throw on write)
- [ ] **Mix rendering:** Often missing error surfacing -- verify user sees an error message (not just console.error) when mix fails
- [ ] **BPM detection:** Often missing validation of detected BPM -- verify BPM values are sane (40-200) and shown to user for confirmation
- [ ] **Offline resilience:** Often missing handling for Mubert API being down -- verify app degrades gracefully (shows cached tracks, allows upload fallback)
- [ ] **Track caching:** Often missing cache invalidation -- verify cached tracks are still valid URLs (Mubert URLs may expire)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Credentials exposed in client code | MEDIUM | Rotate credentials immediately via Mubert dashboard; move to server proxy; audit git history for leaked secrets |
| localStorage quota exceeded | LOW | Migrate audio data to IndexedDB; clear corrupted localStorage entries; no data loss if tracks are re-fetchable from Mubert |
| AudioContext suspended bugs | LOW | Add global resume-on-click handler; test in incognito; 30 minutes of work |
| Async generation not handled | MEDIUM | Refactor generate flow to use polling/webhooks; redesign loading states; 1-2 days of work |
| Quota exhausted mid-session | LOW | Switch to music library browsing (no generation needed); user can still complete kur with library tracks |
| CORS failures in production | LOW | Add Next.js API route proxy; 1 hour of work if caught early |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mubert free tier confusion | Phase 1 (API setup) | Working API credentials that make real requests |
| CORS / credential exposure | Phase 1 (API proxy) | All Mubert calls go through `/api/mubert/`; no `music-api.mubert.com` calls in browser network tab |
| localStorage vs IndexedDB | Phase 1 (persistence) | Audio blobs in IndexedDB; only JSON metadata in localStorage; total localStorage under 100 KB |
| AudioContext autoplay | Phase 2 (preview UI) | Preview works in fresh incognito window (Chrome, Safari, Firefox) |
| Async track generation | Phase 1 (API) + Phase 2 (UI) | Generation shows loading state; completed track is playable; webhook or polling confirmed working |
| Quota waste | Phase 2 (music UI) | Library search is default; generation requires confirmation; counter visible |
| WAV encoding main thread block (existing) | Phase 3 (mix optimization) | Mix rendering does not freeze UI; Web Worker or chunked encoding |
| Silent mix errors (existing) | Phase 2 (error handling) | User sees error toast when mix fails; no silent `console.error` swallowing |

## Sources

- [Mubert API landing page](https://mubert.com/api)
- [Mubert API 3.0 documentation](https://landing.mubert.com/)
- [Mubert integration guide](https://mubert.com/blog/how-to-integrate-ai-music-into-your-video-editing-or-ugc-tool-the-complete-beginners-guide)
- [Mubert API v3 Apiary docs](https://mubertmusicapiv3.docs.apiary.io/)
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MDN: Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay)
- [Chrome: Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [web.dev: Storage for the web](https://web.dev/storage-for-the-web/)
- [web.dev: IndexedDB best practices](https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

---
*Pitfalls research for: Mubert API + audio integration in kur-generator*
*Researched: 2026-03-20*
