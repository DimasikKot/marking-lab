import toast from "react-hot-toast";

import type { Project } from "@/shared/api/projects";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";

type ProjectCardProps = {
  project: Project;
  onClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
};

export const ProjectCard = ({
  project,
  onClick = () => toast.error("Обработка перехода не настроена"),
  onEditClick = () => toast.error("Обработка редактирования не настроена"),
  onDeleteClick = () => toast.error("Обработка удаления не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: ProjectCardProps) => {
  const date = dateIsCreatedAt ? project.created_at : project.updated_at;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-300 rounded-2xl p-4
        hover:border-gray-400 hover:shadow-md transition-all duration-200
        cursor-pointer flex flex-col
        ${className}
      `}
    >
      <div className="flex-1">
        <TextUI variant="title">{project.name}</TextUI>

        {project.description && (
          <TextUI variant="desc" className="mt-2 line-clamp-2">
            {project.description}
          </TextUI>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <TextUI variant="desc">
            {project.is_public ? "Публичный" : "Приватный"}
          </TextUI>

          <TextUI variant="desc" className="text-right">
            {new Date(date).toLocaleDateString("ru-RU", {
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </TextUI>
        </div>

        <div className="flex justify-between gap-3">
          <ButtonUI
            onClick={onEditClick}
            variant="secondary"
            className="text-blue-600 hover:text-blue-800"
          >
            Редактировать
          </ButtonUI>

          <ButtonUI
            onClick={onDeleteClick}
            variant="secondary"
            className="text-red-600 hover:text-red-800"
          >
            Удалить
          </ButtonUI>
        </div>
      </div>
    </div>
  );
};
