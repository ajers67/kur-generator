"use client";

import type { ProjectMeta } from "@/lib/types/project";
import { STEP_LABELS } from "@/lib/types/project";
import type { ArenaPath } from "@/components/ArenaCanvas";
import { ArenaThumbnail } from "./ArenaThumbnail";

interface Props {
  project: ProjectMeta;
  arenaPaths: ArenaPath[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, arenaPaths, onSelect, onDelete }: Props) {
  return (
    <button
      onClick={() => onSelect(project.id)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4 flex gap-4 text-left w-full"
    >
      <ArenaThumbnail paths={arenaPaths} />
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {project.horseName || "Unavngivet"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {project.levelDisplayName || "Intet niveau valgt"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Trin: {STEP_LABELS[project.currentStep]}
        </p>
      </div>
      <div className="flex-shrink-0 self-start">
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
        >
          Slet
        </span>
      </div>
    </button>
  );
}
