import toast from "react-hot-toast";
import type { Project } from "@/shared/api/projects";

export const ProjectCard = ({
  project,
  onClick = () => toast.error("Обработка нажатия не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: {
  project: Project;
  onClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
}) => {
  const date = dateIsCreatedAt ? project.created_at : project.updated_at;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-300 rounded-2xl p-6 
        hover:border-gray-400 hover:shadow-md 
        transition-all duration-200 cursor-pointer 
        ${className}
      `}
    >
      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
        {project.name}
      </h3>

      {project.description && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{project.is_public ? "Публичный" : "Приватный"}</span>

        {new Date(date).toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        })}
      </div>
    </div>
  );
};
