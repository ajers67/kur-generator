import type { ProjectData } from "@/lib/types/project";

const PROJECT_KEY_PREFIX = "kur-project-";

export function saveProjectData(id: string, data: ProjectData): void {
  localStorage.setItem(
    PROJECT_KEY_PREFIX + id,
    JSON.stringify({ state: data, version: 1 }),
  );
}

export function loadProjectData(id: string): ProjectData | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function deleteProjectData(id: string): void {
  localStorage.removeItem(PROJECT_KEY_PREFIX + id);
}
