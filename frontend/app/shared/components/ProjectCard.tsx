import toast from "react-hot-toast";

import type { Project } from "@/shared/api/projects";
import { Button } from "@/shared/components/Button";
import { Text } from "@/shared/components/Text";

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
        transition-all duration-200 cursor-pointer
        ${className}
      `}
    >
      <div>
        <Text variant="title" isSpan>
          {project.name}
        </Text>

        {project.description && (
          <Text variant="desc" isSpan>
            {project.description}
          </Text>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Text variant="desc" isSpan>
            {project.is_public ? "Публичный" : "Приватный"}
          </Text>

          <Text variant="desc" isSpan>
            {new Date(date).toLocaleDateString("ru-RU", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </div>

        <div className="flex flex-row justify-between mt-4">
          <Button
            onClick={handleNavigateClick}
            variant="secondary"
            className="text-green-600 hover:text-green-800"
          >
            Перейти в проект
          </Button>

          <Button
            onClick={handleEditClick}
            variant="secondary"
            className="text-blue-600 hover:text-blue-800"
          >
            Редактировать
          </Button>

          <Button
            onClick={handleDeleteClick}
            variant="secondary"
            className="text-red-600 hover:text-red-800"
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
};
