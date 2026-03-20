# Codebase Concerns

**Analysis Date:** 2026-03-20

## Tech Debt

**Duplicate `generateProgram` logic:**
- Issue: The program ordering algorithm is implemented identically in two places. `page.tsx` has `generateProgramOrder()` (lines 27-70) and `ProgramPreview.tsx` has `generateProgram()` (lines 14-70). Both functions are nearly line-for-line identical — same gait separation, same `sortByStrength`, same temperament branching, same deduplication.
- Files: `src/app/page.tsx`, `src/components/ProgramPreview.tsx`
- Impact: Any fix or change to ordering logic must be applied to both functions. Currently they can silently diverge. The preview step and the arena/music steps could produce different orderings for the same input.
- Fix approach: Extract a single `generateProgramOrder(level, ratings, temperament): Exercise[]` into `src/lib/program-generator.ts` and import it in both places.

**`HorseProfile` type defined but never used:**
- Issue: `src/data/strength-options.ts` defines a `HorseProfile` interface (lines 4-17) that is fully typed and includes fields like `bpm`, `gaitStrengths`, and `preferredStartGait` that don't exist anywhere in the actual app state. The app stores horse data as individual `useState` values in `page.tsx`, not as a `HorseProfile` object.
- Files: `src/data/strength-options.ts`, `src/app/page.tsx`
- Impact: Dead code that suggests unfinished refactor or abandoned approach. No runtime impact, but creates confusion about intent.
- Fix approach: Either delete `HorseProfile` or migrate `page.tsx` state to use it.

**`ArenaPreview` is a stub:**
- Issue: `src/components/ArenaPreview.tsx` is a placeholder that only exports an empty component returning `null`. It is imported in `src/app/page.tsx` (line 11) but never rendered.
- Files: `src/components/ArenaPreview.tsx`, `src/app/page.tsx`
- Impact: Dead import. If a future developer searches for where `ArenaPreview` is used, the import in `page.tsx` is misleading.
- Fix approach: Remove the import in `page.tsx` until the component is actually implemented.

**`musicPreference` collected but never used:**
- Issue: `page.tsx` collects `musicPreference` state (line 78) and passes it into `HorseProfileForm`, but it is never passed to `MusicManager` or used in any mixing logic.
- Files: `src/app/page.tsx`, `src/components/HorseProfileForm.tsx`, `src/components/MusicManager.tsx`
- Impact: User input is silently discarded. The feature appears functional but has no effect.
- Fix approach: Either pass it to `MusicManager` and use it to suggest gait assignments, or remove the field entirely until the feature is built.

**`arenaPaths` state never consumed downstream:**
- Issue: `page.tsx` tracks `arenaPaths` (line 79) and updates it via `onPathsChange`, but it is never passed to `MusicManager` or used in PDF export (not yet built). The drawn routes are visually displayed but have no effect on program output.
- Files: `src/app/page.tsx`
- Impact: Data is captured and discarded. Future PDF export will need to consume this, but there is no forwarding mechanism in place.
- Fix approach: Pass `arenaPaths` to `MusicManager` so it is available for the mix timeline, or note explicitly that PDF export must receive it.

**`trackIndex` stale closure bug in `MusicManager`:**
- Issue: In `handleFileUpload` (line 59), `const trackIndex = tracks.length` captures the length at the time the closure is created, but `tracks` state is only updated asynchronously. This variable is assigned but then never actually used — the code uses `t.file === file` matching instead. The dead variable is a residue of a previous approach.
- Files: `src/components/MusicManager.tsx` (line 59)
- Impact: No runtime bug since the variable is unused, but indicates incomplete refactoring.
- Fix approach: Remove the unused `trackIndex` variable.

**Time parsing assumes `MM:SS` format without validation:**
- Issue: In `MusicManager.handleMix` (lines 122-124), `level.timeMax` is split on `:` and parsed as integers with no validation. If `timeMax` is `"6:00"` the logic works, but if the format ever changes or is malformed, `parseInt` silently returns `NaN` and `totalSec` becomes `NaN`, causing `renderMix` to produce a zero-length buffer.
- Files: `src/components/MusicManager.tsx` (lines 122-124), `src/data/kur-levels.ts`
- Impact: Silent failure — the mix render would produce a broken WAV file with no user-visible error.
- Fix approach: Add a helper `parseTimeToSeconds(str: string): number` with validation and a clear error if parsing fails.

---

## Known Bugs

**Mix error is silently swallowed:**
- Symptoms: If `renderMix` throws (e.g., due to NaN duration, missing track, or OfflineAudioContext failure), the catch block in `handleMix` only calls `console.error`. The UI stays in `mixing: false` state with no error message shown to the user.
- Files: `src/components/MusicManager.tsx` (lines 143-146)
- Trigger: Upload a malformed audio file, or trigger with a level that has a missing gait track assignment.
- Workaround: None — user has no indication the mix failed.

**ArenaEditor `currentExerciseIndex` can go out of sync with `paths`:**
- Symptoms: Clicking an exercise in the list (line 155 in `ArenaEditor.tsx`) sets `currentExerciseIndex` to any arbitrary index without adjusting `paths`. This means a user can click exercise 5, draw a path, and have `paths[4]` associated with exercise 5 but the `isDone` display logic (line 148) uses `i < paths.length` which will show earlier exercises as done even if they were skipped.
- Files: `src/components/ArenaEditor.tsx` (lines 43-63, 148)
- Trigger: Click a non-sequential exercise index, draw a path.
- Workaround: Use the auto-advance flow without manually clicking exercises.

---

## Security Considerations

**No file type validation beyond MIME type:**
- Risk: `handleFileUpload` in `MusicManager` checks `file.type.startsWith("audio/")` but MIME types are browser-reported and can be spoofed. A malformed binary with an `audio/*` MIME type will be passed directly to `AudioContext.decodeAudioData`.
- Files: `src/components/MusicManager.tsx` (line 47)
- Current mitigation: `decodeAudioData` will throw on invalid data, and the error is caught and shown to the user. No server-side processing.
- Recommendations: This is client-only processing so the risk is limited to the user's own browser. No additional mitigation needed unless a server upload path is added.

**No file size limit on audio uploads:**
- Risk: A user could upload a very large audio file (e.g., 500 MB+), causing the browser to allocate a large `ArrayBuffer` and potentially crash the tab or exhaust memory during `decodeAudioData`.
- Files: `src/components/MusicManager.tsx` (line 63)
- Current mitigation: None.
- Recommendations: Add a check: `if (file.size > 50 * 1024 * 1024) { show error; return; }` before processing.

---

## Performance Bottlenecks

**Full WAV render blocks main thread perception:**
- Problem: `renderMix` uses `OfflineAudioContext` which is async and off the main thread, but `audioBufferToWav` (called immediately after) is a synchronous CPU-bound loop that processes every sample of a 4-6 minute stereo WAV (potentially 50-60 million iterations).
- Files: `src/lib/audio-mixer.ts` (lines 99-145)
- Cause: PCM sample interleaving is done with a plain `for` loop with no chunking or yielding.
- Improvement path: Move WAV encoding to a Web Worker, or use `AudioEncoder` API where available.

**`bpm-detect` creates a new `AudioContext` per file, then also creates one in `handleFileUpload`:**
- Problem: For each uploaded file, `handleFileUpload` creates and decodes an `AudioContext` (lines 63-66), then `detectBPM` also creates its own `AudioContext` and decodes the same file again from the same `ArrayBuffer` (lines 3-5 in `bpm-detect.ts`). This means each file is decoded twice.
- Files: `src/components/MusicManager.tsx` (lines 61-71), `src/lib/bpm-detect.ts` (lines 1-12)
- Cause: `detectBPM` takes a `File` and re-reads the `arrayBuffer`, but the parent already has the decoded `AudioBuffer`.
- Improvement path: Change `detectBPM` to accept a pre-decoded `AudioBuffer` instead of a `File`. The parent already has it.

**`ArenaCanvas` redraws entire canvas on every pointer move:**
- Problem: The `draw` callback in `ArenaCanvas` redraws all paths, all letter markers, and all decorations on every `onPointerMove` event (which fires at 60+ fps during drawing). With many paths, this scales linearly.
- Files: `src/components/ArenaCanvas.tsx` (lines 88-192, 227-229)
- Cause: The `useEffect` re-runs `draw` on every change to `currentPath`, which updates on every pointer move.
- Improvement path: Use `requestAnimationFrame` throttling, or split into a static background layer canvas and a dynamic drawing layer canvas.

---

## Fragile Areas

**Exercise ID uniqueness assumed across levels:**
- Files: `src/data/kur-levels.ts`, `src/app/page.tsx` (line 75)
- Why fragile: Exercise IDs are integers starting from 1 within each level. All levels reuse IDs 1-16. The `exerciseRatings` state in `page.tsx` is keyed by `id`, and it is cleared when a new level is selected. But if level switching state handling ever fails (e.g., back-navigation), ratings from one level could corrupt another level's display since id 1 in LA and id 1 in Grand Prix are different exercises.
- Safe modification: When adding levels, always reset `exerciseRatings` on level change (already done in `page.tsx` line 122). Never use IDs as globally unique identifiers — they are level-scoped only.
- Test coverage: None.

**`generateMixTimeline` assumes equal duration per exercise:**
- Files: `src/lib/audio-mixer.ts` (lines 18-48)
- Why fragile: All exercises are assigned `totalDurationSec / exerciseCount` seconds regardless of their actual complexity, coefficient, or gait. An "Indridning" (entry) gets the same time slot as a double-coefficient trav movement. The resulting mix will not reflect a realistic kür structure.
- Safe modification: The timeline generator is the primary extension point for future improvements. Do not rely on segment durations matching actual riding time.
- Test coverage: None.

**`ExerciseList` gait grouping order is non-deterministic:**
- Files: `src/components/ExerciseList.tsx` (lines 20-27)
- Why fragile: `level.exercises.reduce(...)` into a plain object preserves insertion order in modern JS (V8), but this is not guaranteed by the spec for non-integer keys. The exercise data in `kur-levels.ts` has consistent ordering, so this works in practice, but could fail with certain future exercise data shapes or environments.
- Safe modification: Use a `Map` or an explicit gait ordering array (`["skridt", "trav", "galop", "passage", "piaffe", "overgang"]`) to sort groups.
- Test coverage: None.

---

## Missing Critical Features

**No persistence — all state is lost on page reload:**
- Problem: The entire 6-step wizard state lives in React `useState` in `src/app/page.tsx`. There is no `localStorage`, `sessionStorage`, or backend persistence. Refreshing the browser at step 5 (arena drawing) loses all work including drawn paths, exercise ratings, and horse profile.
- Blocks: Production use — users doing serious kür planning cannot trust the tool with their work.

**No PDF/print export:**
- Problem: The DEVLOG identifies this as Fase 3, but the UI has no export mechanism at all. The `ProgramPreview` step shows a complete formatted program table that a user would expect to print or save, but there is no print button or PDF generation.
- Blocks: Real-world use at competition — riders need a printed protocol sheet.

**Arena size selection (`arenaSize: "both"`) has no effect:**
- Problem: `KurLevel.arenaSize` has values `"20x40"`, `"20x60"`, or `"both"`, but `ArenaCanvas` always renders a 20x60 arena with the 60m letter set (`ARENA_LETTERS_60`). Levels marked `"both"` (LA, LA6, Pony) should offer the user a 20x40 option, which has a different letter layout.
- Files: `src/components/ArenaCanvas.tsx`, `src/data/kur-levels.ts`
- Blocks: Correct use for LA, LA6, and Pony levels where many riders use the smaller 20x40 arena.

---

## Test Coverage Gaps

**No tests exist:**
- What's not tested: Everything. There are zero test files in the project.
- Files: All of `src/`
- Risk: The two independent implementations of the program generation algorithm could diverge. The time parsing in `MusicManager` could break silently. The WAV encoder could produce invalid output on edge-case audio.
- Priority: High for `src/lib/audio-mixer.ts` and `src/lib/bpm-detect.ts` (pure functions with complex logic), Medium for `src/app/page.tsx` `generateProgramOrder` once deduplicated.

---

*Concerns audit: 2026-03-20*
