import toast from "react-hot-toast";

import type { Project } from "@/shared/api/projects";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";

export const ProjectCard = ({
  project,
  handleEditClick = () => toast.error("Обработка редактирования не настроена"),
  handleDeleteClick = () => toast.error("Обработка удаления не настроена"),
  handleNavigateClick = () => toast.error("Обработка перехода не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: {
  project: Project;
  handleEditClick?: () => void;
  handleDeleteClick?: () => void;
  handleNavigateClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
}) => {
  const date = dateIsCreatedAt ? project.created_at : project.updated_at;

  return (
    <div
      className={`
        flex flex-col justify-between
        bg-white border border-gray-300 rounded-2xl p-4
        hover:border-gray-400 hover:shadow-md
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex flex-col">
        <TextUI variant="title" className="overflow-auto" isSpan>
          {project.name}
        </TextUI>

        {project.description && (
          <TextUI variant="desc" className="overflow-auto" isSpan>
            {project.description}
          </TextUI>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <TextUI variant="desc" isSpan>
            {project.is_public ? "Публичный" : "Приватный"}
          </TextUI>

          <TextUI variant="desc" isSpan>
            {new Date(date).toLocaleDateString("ru-RU", {
              month: "short",
              day: "numeric",
            })}
          </TextUI>
        </div>

        <div className="flex flex-row justify-between mt-4">
          <ButtonUI
            onClick={handleNavigateClick}
            variant="secondary"
            className="text-green-600 hover:text-green-800"
          >
            Перейти в проект
          </ButtonUI>

          <ButtonUI
            onClick={handleEditClick}
            variant="secondary"
            className="text-blue-600 hover:text-blue-800"
          >
            Редактировать
          </ButtonUI>

          <ButtonUI
            onClick={handleDeleteClick}
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
