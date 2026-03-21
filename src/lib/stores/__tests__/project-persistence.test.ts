import { describe, it, expect, beforeEach } from "vitest";
import {
  saveProjectData,
  loadProjectData,
  deleteProjectData,
} from "@/lib/stores/project-persistence";
import { DEFAULT_PROJECT_DATA } from "@/lib/types/project";
import type { ProjectData } from "@/lib/types/project";

const testData: ProjectData = {
  ...DEFAULT_PROJECT_DATA,
  horseName: "TestHest",
  temperament: "calm",
};

const testDataWithPaths: ProjectData = {
  ...testData,
  arenaPaths: [
    {
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ],
      gait: "trav",
      exerciseId: 1,
      exerciseName: "Test",
    },
  ],
};

describe("project-persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saveProjectData stores JSON in localStorage at key 'kur-project-{id}' with version 1", () => {
    saveProjectData("abc", testData);
    const raw = localStorage.getItem("kur-project-abc");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.state.horseName).toBe("TestHest");
  });

  it("loadProjectData returns saved data for existing key", () => {
    saveProjectData("abc", testData);
    const result = loadProjectData("abc");
    expect(result).not.toBeNull();
    expect(result!.horseName).toBe("TestHest");
    expect(result!.temperament).toBe("calm");
  });

  it("loadProjectData returns null for missing key", () => {
    const result = loadProjectData("nonexistent");
    expect(result).toBeNull();
  });

  it("loadProjectData returns null for corrupted JSON", () => {
    localStorage.setItem("kur-project-bad", "not json");
    const result = loadProjectData("bad");
    expect(result).toBeNull();
  });

  it("deleteProjectData removes the key from localStorage", () => {
    saveProjectData("abc", testData);
    expect(localStorage.getItem("kur-project-abc")).not.toBeNull();
    deleteProjectData("abc");
    expect(localStorage.getItem("kur-project-abc")).toBeNull();
  });

  it("ArenaPath[] with nested PathPoint[] arrays survives save/load roundtrip (PERS-03)", () => {
    saveProjectData("paths", testDataWithPaths);
    const result = loadProjectData("paths");
    expect(result).not.toBeNull();
    expect(result!.arenaPaths).toHaveLength(1);
    expect(result!.arenaPaths[0].points).toEqual([
      { x: 0.1, y: 0.2 },
      { x: 0.3, y: 0.4 },
    ]);
    expect(result!.arenaPaths[0].gait).toBe("trav");
    expect(result!.arenaPaths[0].exerciseId).toBe(1);
  });
});
