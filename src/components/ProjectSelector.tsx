"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/lib/stores/project-store";
import { loadProjectData } from "@/lib/stores/project-persistence";
import { ProjectCard } from "./ProjectCard";
import type { ArenaPath } from "@/components/ArenaCanvas";

interface Props {
  onProjectSelected: (id: string) => void;
}

export function ProjectSelector({ onProjectSelected }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const [pathsMap, setPathsMap] = useState<Record<string, ArenaPath[]>>({});

  useEffect(() => {
    const map: Record<string, ArenaPath[]> = {};
    for (const project of projects) {
      const data = loadProjectData(project.id);
      map[project.id] = data?.arenaPaths ?? [];
    }
    setPathsMap(map);
  }, [projects]);

  const handleCreate = () => {
    const newId = useProjectStore.getState().createProject();
    onProjectSelected(newId);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "Er du sikker på at du vil slette dette projekt? Handlingen kan ikke fortrydes.",
      )
    ) {
      useProjectStore.getState().deleteProject(id);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dine kür-projekter
        </h2>
        <p className="text-gray-500 mb-8">
          Du har ingen gemte projekter endnu.
        </p>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Opret ny kür
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Dine kür-projekter
        </h2>
        <button
          onClick={handleCreate}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Opret ny kür
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            arenaPaths={pathsMap[project.id] ?? []}
            onSelect={(id) => onProjectSelected(id)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
