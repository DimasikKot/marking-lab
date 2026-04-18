import toast from "react-hot-toast";

import type { Project } from "@/shared/api/projects";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";

export const ProjectCard = ({
  project,
  onClick = () => toast.error("Обработка перехода не настроена"),
  onEditClick = () => toast.error("Обработка редактирования не настроена"),
  onDeleteClick = () => toast.error("Обработка удаления не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: {
  project: Project;
  onClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
}) => {
  const date = dateIsCreatedAt ? project.created_at : project.updated_at;

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col justify-between
        bg-white border border-gray-300 rounded-2xl p-4
        hover:border-gray-400 hover:shadow-md
        transition-all duration-200 cursor-pointer
        ${className}
      `}
    >
      <div className="flex flex-row justify-between">
        <div className="flex flex-col max-w-md">
          <TextUI variant="title" isSpan>
            {project.name}
          </TextUI>

          {project.description && (
            <TextUI variant="desc" isSpan>
              {project.description}
            </TextUI>
          )}
        </div>

        <TextUI variant="desc" isSpan>
          {new Date(date).toLocaleDateString("ru-RU", {
            month: "short",
            day: "numeric",
          })}
        </TextUI>
      </div>

      <div className="mt-4">
        <TextUI variant="desc" isSpan>
          {project.is_public ? "Публичный" : "Приватный"}
        </TextUI>

        <div className="flex flex-row justify-between">
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
