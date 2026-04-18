import toast from "react-hot-toast";

import type { FileInList as File } from "@/shared/api/file";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "./ButtonUI";

type FileCardProps = {
  file: File;
  onClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
};

export const FileCard = ({
  file,
  onClick = () => toast.error("Обработка нажатия не настроена"),
  onEditClick = () => toast.error("Обработка редактирования не настроена"),
  onDeleteClick = () => toast.error("Обработка удаления не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: FileCardProps) => {
  const date = dateIsCreatedAt ? file.created_at : file.updated_at;

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
      <TextUI variant="title">{file.name}</TextUI>

      <TextUI variant="desc" className="mt-auto pt-4 text-right">
        {new Date(date).toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        })}
      </TextUI>

      <div className="flex justify-between gap-3 mt-4">
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
  );
};
