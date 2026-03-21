import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectStore } from "@/lib/stores/project-store";

// Mock crypto.randomUUID for deterministic tests
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

describe("project-store", () => {
  beforeEach(() => {
    localStorage.clear();
    uuidCounter = 0;
    useProjectStore.setState({ projects: [], activeProjectId: null });
  });

  it("createProject adds a new ProjectMeta with valid UUID and returns the id", () => {
    const id = useProjectStore.getState().createProject();
    expect(id).toBe("test-uuid-1");
    const { projects } = useProjectStore.getState();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("test-uuid-1");
    expect(projects[0].createdAt).toBeTruthy();
    expect(projects[0].updatedAt).toBeTruthy();
  });

  it("createProject sets the new project as activeProjectId", () => {
    const id = useProjectStore.getState().createProject();
    const { activeProjectId } = useProjectStore.getState();
    expect(activeProjectId).toBe(id);
  });

  it("deleteProject removes project from list", () => {
    const id = useProjectStore.getState().createProject();
    expect(useProjectStore.getState().projects).toHaveLength(1);
    useProjectStore.getState().deleteProject(id);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it("deleteProject calls deleteProjectData to clean localStorage (PERS-04)", () => {
    // Save some project data to localStorage first
    localStorage.setItem(
      `kur-project-test-uuid-1`,
      JSON.stringify({ state: {}, version: 1 }),
    );
    const id = useProjectStore.getState().createProject();
    useProjectStore.getState().deleteProject(id);
    // The project data key should be removed
    expect(localStorage.getItem(`kur-project-${id}`)).toBeNull();
  });

  it("deleteProject sets activeProjectId to null when deleting active project", () => {
    const id = useProjectStore.getState().createProject();
    expect(useProjectStore.getState().activeProjectId).toBe(id);
    useProjectStore.getState().deleteProject(id);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });

  it("updateProjectMeta updates horseName and updatedAt on matching project", () => {
    const id = useProjectStore.getState().createProject();
    // Force a known createdAt so we can detect the change
    useProjectStore.setState({
      projects: useProjectStore.getState().projects.map((p) =>
        p.id === id ? { ...p, updatedAt: "2020-01-01T00:00:00.000Z" } : p,
      ),
    });

    useProjectStore.getState().updateProjectMeta(id, { horseName: "Blixen" });

    const { projects } = useProjectStore.getState();
    expect(projects[0].horseName).toBe("Blixen");
    expect(projects[0].updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
  });

  it("setActiveProject changes activeProjectId", () => {
    useProjectStore.getState().createProject();
    useProjectStore.getState().createProject();
    useProjectStore.getState().setActiveProject("test-uuid-1");
    expect(useProjectStore.getState().activeProjectId).toBe("test-uuid-1");
    useProjectStore.getState().setActiveProject(null);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });
});
