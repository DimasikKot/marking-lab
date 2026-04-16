import toast from "react-hot-toast";

import type { FileInList as File } from "@/shared/api/file";
import { TextUI } from "@/shared/components/TextUI";

export const FileCard = ({
  file,
  onClick = () => toast.error("Обработка нажатия не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: {
  file: File;
  onClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
}) => {
  const date = dateIsCreatedAt ? file.created_at : file.updated_at;

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
      <TextUI variant="normal">{file.name}</TextUI>

      <TextUI variant="desc" className="mt-4">
        {new Date(date).toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        })}
      </TextUI>
    </div>
  );
};
