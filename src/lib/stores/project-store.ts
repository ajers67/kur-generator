import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProjectMeta, Step } from "@/lib/types/project";
import { deleteProjectData } from "@/lib/stores/project-persistence";

interface ProjectListState {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  createProject: () => string;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  updateProjectMeta: (
    id: string,
    meta: Partial<Pick<ProjectMeta, "horseName" | "levelId" | "levelDisplayName" | "currentStep">>,
  ) => void;
}

export const useProjectStore = create<ProjectListState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: () => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const meta: ProjectMeta = {
          id,
          horseName: "",
          levelId: "",
          levelDisplayName: "",
          currentStep: "level" as Step,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: [...state.projects, meta],
          activeProjectId: id,
        }));
        return id;
      },

      deleteProject: (id: string) => {
        deleteProjectData(id);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id: string | null) => {
        set({ activeProjectId: id });
      },

      updateProjectMeta: (
        id: string,
        meta: Partial<Pick<ProjectMeta, "horseName" | "levelId" | "levelDisplayName" | "currentStep">>,
      ) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...meta, updatedAt: new Date().toISOString() }
              : p,
          ),
        }));
      },
    }),
    {
      name: "kur-projects",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
