# Phase 2: Wizard Persistence - Research

**Researched:** 2026-03-21
**Domain:** Client-side state persistence with localStorage in Next.js App Router
**Confidence:** HIGH

## Summary

This phase adds localStorage persistence to all wizard state so riders can close the browser and resume where they left off. The current codebase uses plain `useState` hooks in a single `page.tsx` orchestrator with no state library. The recommended approach is to introduce Zustand with its built-in `persist` middleware, which provides localStorage persistence out of the box with minimal boilerplate.

The main technical challenge is Next.js SSR hydration: the server render has no localStorage, so the first client render must match the server's empty state before rehydrating from storage. Zustand's persist middleware handles this, but requires a deliberate hydration-safe pattern (useEffect-based or skipHydration). The multi-project requirement adds a data modeling layer: a project list in one localStorage key, with each project's full state in a separate key.

**Primary recommendation:** Use Zustand 5.x with `persist` middleware. One store for project metadata (list of projects, active project ID). One store for the active project's wizard state. Hydration-safe wrapper component to prevent SSR mismatch.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: All wizard state is persisted: level, horse profile, temperament, exercise ratings (steps 1-3)
- D-02: Generated program order is persisted (step 4)
- D-03: Arena data (currently freehand paths, future: auto-generated routes + user adjustments) is persisted (step 5)
- D-04: Music selection metadata (Lyria prompts, genre/mood per gait) is persisted in localStorage. Actual audio data is NOT in this phase (Phase 8: IndexedDB).
- D-05: Current wizard step is persisted so restore knows where user left off
- D-06: Users can have multiple projects saved simultaneously
- D-07: Each project has a unique ID and stores all its state independently
- D-08: Projects are identified by horse name + level for display
- D-09: Claude's Discretion -- choose best UI pattern for project selection
- D-10: "Start forfra" deletes only the active project
- D-11: After deleting, user returns to project selection (or starts new if it was the only project)
- D-12: Confirmation dialog before deleting
- D-13: When opening app with saved projects, show project overview first
- D-14: Project overview shows: horse name, level, and arena preview thumbnail (read-only)
- D-15: User clicks a project to continue from where they left off
- D-16: "Opret ny kur" button to start fresh project

### Claude's Discretion
- State management approach (zustand, Context API, or plain localStorage)
- localStorage key structure and serialization format
- Hydration strategy for Next.js SSR compatibility
- Project overview layout and card design
- Arena thumbnail rendering approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERS-01 | Wizard-state gemmes i localStorage og overlever refresh | Zustand persist middleware provides automatic localStorage serialization/deserialization with version migration support |
| PERS-03 | Arena-ruter og tilpasninger gemmes og overlever refresh | ArenaPath[] (with PathPoint[] nested arrays) serializes cleanly to JSON; included in persisted project state |
| PERS-04 | Bruger kan starte forfra (ryd alt gemt state) | Zustand store action that removes active project from localStorage and resets store to defaults |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.12 | State management + persistence | De facto React state library for client-heavy apps. Built-in persist middleware eliminates hand-rolling localStorage sync. Tiny (1.2kB). No providers needed. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | No additional dependencies needed. crypto.randomUUID() is available in all modern browsers for project IDs. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | Plain localStorage + useState | More boilerplate, must hand-roll serialization, hydration, version migration. Zustand persist does all of this. |
| Zustand | React Context + useReducer | No built-in persistence. Would need manual localStorage sync in useEffect. More code for same result. |
| crypto.randomUUID() | uuid package | Unnecessary dependency. randomUUID() has >97% browser support and is built-in. |

**Installation:**
```bash
npm install zustand
```

**Version verification:** zustand 5.0.12 confirmed via `npm view zustand version` on 2026-03-21.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    stores/
      project-store.ts    # Multi-project list + active project ID
      wizard-store.ts     # Active project's wizard state (persisted)
    use-hydration.ts      # Hydration-safe hook for SSR compatibility
  components/
    ProjectSelector.tsx   # Project overview / selection screen
    ProjectCard.tsx       # Individual project card with arena thumbnail
    ArenaThumbnail.tsx    # Small read-only arena canvas for preview
```

### Pattern 1: Zustand Persist Store Definition
**What:** Define a persisted store with type-safe state, actions, and localStorage sync
**When to use:** For all state that must survive page refresh

```typescript
// src/lib/stores/wizard-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import type { ArenaPath } from "@/components/ArenaCanvas";

type Step = "level" | "profile" | "exercises" | "preview" | "arena" | "music";

interface WizardState {
  // Data
  selectedLevel: KurLevel | null;
  horseName: string;
  temperament: "calm" | "neutral" | "energetic";
  exerciseRatings: Record<number, StrengthRating>;
  programOrder: number[]; // exercise IDs in order (derived, but persisted per D-02)
  arenaPaths: ArenaPath[];
  currentStep: Step;

  // Actions
  setLevel: (level: KurLevel) => void;
  setHorseName: (name: string) => void;
  setTemperament: (t: "calm" | "neutral" | "energetic") => void;
  setExerciseRating: (id: number, rating: StrengthRating) => void;
  setProgramOrder: (order: number[]) => void;
  setArenaPaths: (paths: ArenaPath[]) => void;
  setStep: (step: Step) => void;
  resetProject: () => void;
}

const INITIAL_STATE = {
  selectedLevel: null,
  horseName: "",
  temperament: "neutral" as const,
  exerciseRatings: {},
  programOrder: [],
  arenaPaths: [],
  currentStep: "level" as Step,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setLevel: (level) => set({ selectedLevel: level, exerciseRatings: {} }),
      setHorseName: (name) => set({ horseName: name }),
      setTemperament: (t) => set({ temperament: t }),
      setExerciseRating: (id, rating) =>
        set((s) => ({ exerciseRatings: { ...s.exerciseRatings, [id]: rating } })),
      setProgramOrder: (order) => set({ programOrder: order }),
      setArenaPaths: (paths) => set({ arenaPaths: paths }),
      setStep: (step) => set({ currentStep: step }),
      resetProject: () => set(INITIAL_STATE),
    }),
    {
      name: "kur-project-{id}", // dynamic per project
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Pattern 2: Multi-Project Store with Dynamic Keys
**What:** A meta-store that tracks all project IDs, with per-project stores using unique localStorage keys
**When to use:** When users need multiple independent saved states (D-06, D-07)

The recommended approach for multiple projects:
1. **Project list store** persisted at key `kur-projects` -- stores `{ projects: ProjectMeta[], activeProjectId: string | null }`
2. **Active project wizard state** persisted at key `kur-project-{id}` -- stores the full wizard state
3. When switching projects: save current wizard state, load new project's state from localStorage

```typescript
// src/lib/stores/project-store.ts
interface ProjectMeta {
  id: string;           // crypto.randomUUID()
  horseName: string;
  levelId: string;
  levelDisplayName: string;
  currentStep: Step;
  createdAt: string;    // ISO date
  updatedAt: string;    // ISO date
}

interface ProjectListState {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  createProject: () => string;        // returns new ID
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  updateProjectMeta: (id: string, meta: Partial<ProjectMeta>) => void;
}
```

### Pattern 3: Hydration-Safe Rendering for Next.js
**What:** Prevent SSR hydration mismatch by deferring localStorage-dependent rendering
**When to use:** Always, when persisted state drives UI in Next.js App Router

```typescript
// src/lib/use-hydration.ts
"use client";
import { useState, useEffect } from "react";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
```

Usage in page.tsx:
```typescript
const hydrated = useHydrated();
if (!hydrated) {
  return <LoadingSkeleton />; // matches server render
}
// Now safe to read from zustand persisted store
```

This is the simplest and most reliable pattern. Both server and first client render show the skeleton. After useEffect fires, `hydrated` becomes true and the real UI renders with persisted data.

### Pattern 4: Arena Thumbnail for Project Cards
**What:** Render a small read-only version of ArenaCanvas for project overview cards
**When to use:** D-14 requires arena preview in project selection

The existing `ArenaCanvas` component already accepts `paths`, `width`, `height` props and renders them on a canvas. A thumbnail can reuse this component with:
- Small dimensions (e.g., 120x180)
- Empty `currentPath` and no event handlers
- No `isDrawing` state

```typescript
<ArenaCanvas
  width={120}
  height={180}
  paths={project.arenaPaths}
  currentPath={[]}
  currentGait="trav"
  isDrawing={false}
  onMouseDown={() => {}}
  onMouseMove={() => {}}
  onMouseUp={() => {}}
/>
```

**Better approach:** Refactor ArenaCanvas to accept an optional `readOnly` prop that skips event handler wiring and pointer styles. This avoids passing dummy handlers.

### Anti-Patterns to Avoid
- **Reading localStorage in render:** Never call `localStorage.getItem()` directly during render. It causes hydration mismatch. Always go through zustand persist or useEffect.
- **Single monolithic localStorage key:** Do not store all projects in one giant JSON blob. Per-project keys allow independent reads/writes and avoid the risk of corrupting all data at once.
- **Persisting derived state unnecessarily:** `programOrder` is derived from `(level, ratings, temperament)` via `generateProgramOrder()`. However, D-02 explicitly requires persisting it so the user sees the same program on restore (the generator has randomization per PROG-04). Store the exercise ID array, not the full Exercise objects.
- **Forgetting to update ProjectMeta:** When wizard state changes (horseName, level, step), the project list meta must also be updated so the project overview cards stay current.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage serialization + deserialization | Manual JSON.stringify/parse with error handling | Zustand persist middleware | Handles serialization, versioning, migration, and rehydration |
| State version migration | If/else checks on raw JSON | Zustand persist `version` + `migrate` options | Built-in version tracking with typed migration function |
| Unique IDs | Custom ID generator or uuid package | `crypto.randomUUID()` | Built into all modern browsers, returns UUID v4 |
| Confirmation dialogs | Custom modal component | `window.confirm()` (for now) | Simple, native, accessible. Can upgrade to custom modal later if needed. |

**Key insight:** Zustand persist eliminates 90% of the persistence boilerplate. The remaining work is data modeling (project structure) and UI (project selector).

## Common Pitfalls

### Pitfall 1: Next.js Hydration Mismatch
**What goes wrong:** Server renders with empty/default state, client hydrates with localStorage data, React throws hydration error.
**Why it happens:** `localStorage` does not exist on the server. Zustand persist reads from it synchronously on the client.
**How to avoid:** Use a `useHydrated()` hook that returns false on first render. Show a loading skeleton until hydrated. Both server and client render the same skeleton initially.
**Warning signs:** Console error: "Text content did not match" or "Hydration failed because the initial UI does not match."

### Pitfall 2: Stale Project Meta
**What goes wrong:** Project overview cards show outdated horse name or level because ProjectMeta was not updated when wizard state changed.
**Why it happens:** Two separate stores (project list + wizard state) need to stay in sync.
**How to avoid:** Whenever `horseName`, `selectedLevel`, or `currentStep` changes in the wizard store, also call `updateProjectMeta()` on the project list store. Use a zustand `subscribe` listener or update both in the same action.
**Warning signs:** Project card shows "Unnamed" or old horse name after editing.

### Pitfall 3: localStorage Size Limits
**What goes wrong:** ArenaPath data with many points could grow large. localStorage has a ~5MB limit per origin.
**Why it happens:** Freehand drawing can generate hundreds of PathPoint objects per exercise, and there can be 10-20 exercises.
**How to avoid:** Point throttling already exists in ArenaEditor. Additionally, consider path simplification (Douglas-Peucker) if paths exceed a threshold. Monitor with a utility: `new Blob([JSON.stringify(state)]).size`.
**Warning signs:** `QuotaExceededError` in console when calling `localStorage.setItem()`.

### Pitfall 4: Breaking Schema Changes in Future Phases
**What goes wrong:** Phase 5 (auto-generated routes) will change the ArenaPath structure. Old persisted data becomes incompatible.
**Why it happens:** No versioning or migration in place.
**How to avoid:** Use zustand persist's `version` option from day one. Set `version: 1` now. When schema changes in Phase 5, increment to `version: 2` and add a `migrate` function.
**Warning signs:** App crashes on load after deploy with schema changes.

### Pitfall 5: Deleting Active Project Without Cleanup
**What goes wrong:** "Start forfra" deletes the project from the list but leaves orphaned data in localStorage.
**Why it happens:** Project data is stored in a separate key (`kur-project-{id}`).
**How to avoid:** The delete action must: (1) remove from project list, (2) call `localStorage.removeItem(`kur-project-${id}`)`, (3) reset wizard store, (4) navigate to project selection or create new.
**Warning signs:** localStorage grows indefinitely with orphaned project keys.

## Code Examples

### Complete Project Data Model
```typescript
// src/lib/types/project.ts
import type { KurLevel } from "@/data/kur-levels";
import type { StrengthRating } from "@/data/strength-options";
import type { ArenaPath } from "@/components/ArenaCanvas";

export type Step = "level" | "profile" | "exercises" | "preview" | "arena" | "music";

export interface ProjectMeta {
  id: string;
  horseName: string;
  levelId: string;
  levelDisplayName: string;
  currentStep: Step;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  selectedLevel: KurLevel | null;
  horseName: string;
  temperament: "calm" | "neutral" | "energetic";
  exerciseRatings: Record<number, StrengthRating>;
  programOrder: number[];     // persisted exercise ID order
  arenaPaths: ArenaPath[];
  currentStep: Step;
}

export const DEFAULT_PROJECT_DATA: ProjectData = {
  selectedLevel: null,
  horseName: "",
  temperament: "neutral",
  exerciseRatings: {},
  programOrder: [],
  arenaPaths: [],
  currentStep: "level",
};
```

### localStorage Key Schema
```
kur-projects          -> { state: { projects: ProjectMeta[], activeProjectId: string | null }, version: 1 }
kur-project-{uuid}    -> { state: ProjectData, version: 1 }
```

### Hydration-Safe Page Component
```typescript
// src/app/page.tsx (simplified structure)
"use client";

import { useHydrated } from "@/lib/use-hydration";
import { useProjectStore } from "@/lib/stores/project-store";
import { ProjectSelector } from "@/components/ProjectSelector";
import { WizardView } from "@/components/WizardView"; // extracted from current page.tsx

export default function Home() {
  const hydrated = useHydrated();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Kur Generator</h1>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center text-gray-400">
          Indlaeser...
        </div>
      </main>
    );
  }

  if (!activeProjectId) {
    return <ProjectSelector />;
  }

  return <WizardView />;
}
```

### Dynamic Per-Project Persistence
Since zustand persist requires a static store name, the multi-project pattern works differently than a single persist store. The recommended approach:

```typescript
// Save/load project data manually with a helper
const PROJECT_KEY_PREFIX = "kur-project-";

export function saveProjectData(id: string, data: ProjectData): void {
  const payload = { state: data, version: 1 };
  localStorage.setItem(`${PROJECT_KEY_PREFIX}${id}`, JSON.stringify(payload));
}

export function loadProjectData(id: string): ProjectData | null {
  const raw = localStorage.getItem(`${PROJECT_KEY_PREFIX}${id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Version migration would go here
    return parsed.state as ProjectData;
  } catch {
    return null;
  }
}

export function deleteProjectData(id: string): void {
  localStorage.removeItem(`${PROJECT_KEY_PREFIX}${id}`);
}
```

The project LIST store uses zustand persist (single key). Individual project DATA uses manual localStorage helpers because the key is dynamic. The wizard zustand store is an in-memory store (no persist) that loads/saves via these helpers when switching projects.

This is simpler and more reliable than trying to dynamically swap zustand persist store names.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| zustand v4 with separate persist import | zustand v5 with `persist` from `zustand/middleware` | Late 2024 | Import path unchanged but internal implementation uses useSyncExternalStore |
| Custom useLocalStorage hooks | Zustand persist middleware | Established pattern | No need for hand-rolled sync logic |
| Redux Persist | Zustand persist | 2023+ | Zustand is simpler for client-only apps without complex middleware chains |

**Deprecated/outdated:**
- zustand v3 `create` without double-invoke (`create<T>()((set) => ...)` is the v4/v5 pattern -- the outer `()` is required for TypeScript middleware inference)
- `window.localStorage` existence checks: Not needed in this project since it only runs client-side (no SSR data fetching)

## Open Questions

1. **Dynamic store name vs manual localStorage**
   - What we know: Zustand persist requires a static `name` at store creation time. Multiple projects need different keys.
   - What's unclear: Whether zustand's `persist` can be cleanly re-initialized with a new name on project switch.
   - Recommendation: Use zustand persist for the project LIST only. Use manual `localStorage.getItem/setItem` with helpers for per-project data. Keep the wizard store as a plain (non-persist) zustand store that loads/saves via helpers.

2. **Arena thumbnail performance**
   - What we know: ArenaCanvas uses Canvas 2D API and redraws on every render via useEffect.
   - What's unclear: Whether rendering 5+ canvas thumbnails simultaneously on the project selector will cause jank.
   - Recommendation: Start with direct ArenaCanvas reuse at small size. If performance is poor, switch to pre-rendered data URLs (`canvas.toDataURL()`) stored in ProjectMeta.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-01 | Wizard state persists in localStorage and survives simulated refresh | unit | `npx vitest run src/lib/stores/__tests__/wizard-store.test.ts -t "persists"` | No -- Wave 0 |
| PERS-03 | Arena paths persist and restore correctly | unit | `npx vitest run src/lib/stores/__tests__/wizard-store.test.ts -t "arena"` | No -- Wave 0 |
| PERS-04 | "Start forfra" clears active project data | unit | `npx vitest run src/lib/stores/__tests__/project-store.test.ts -t "delete"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install vitest: `npm install -D vitest`
- [ ] `vitest.config.ts` -- configure with path aliases matching tsconfig
- [ ] `src/lib/stores/__tests__/project-store.test.ts` -- covers PERS-04
- [ ] `src/lib/stores/__tests__/wizard-store.test.ts` -- covers PERS-01, PERS-03
- [ ] localStorage mock setup (vitest runs in jsdom/happy-dom which provides localStorage)

## Sources

### Primary (HIGH confidence)
- [Zustand official persist docs](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) - persist middleware API, partialize, version, migrate options
- [Zustand GitHub](https://github.com/pmndrs/zustand) - v5.0.12 confirmed current via npm registry
- Codebase analysis: `src/app/page.tsx`, `src/components/ArenaCanvas.tsx`, `src/data/kur-levels.ts` -- actual state shape and types

### Secondary (MEDIUM confidence)
- [Zustand + Next.js hydration discussion #1382](https://github.com/pmndrs/zustand/discussions/1382) - hydration error patterns and solutions
- [How to use Zustand persist in Next.js - DEV](https://dev.to/abdulsamad/how-to-use-zustands-persist-middleware-in-nextjs-4lb5) - useHydrated pattern verified against multiple sources
- [Zustand persist partialize discussion #1273](https://github.com/pmndrs/zustand/discussions/1273) - partialize API behavior

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or multiple community sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zustand is the established choice, version verified, persist middleware well-documented
- Architecture: HIGH - multi-project pattern is straightforward data modeling, hydration pattern is well-established
- Pitfalls: HIGH - hydration mismatch is the most documented Next.js+zustand issue, solutions are proven

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable ecosystem, zustand v5 is mature)
