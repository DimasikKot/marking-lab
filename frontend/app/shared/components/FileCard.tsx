import type { FileInList as File } from "@/shared/api/file";
import toast from "react-hot-toast";

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
      <p className="font-medium text-gray-900 text-[17px] leading-tight line-clamp-2 mb-4">
        {file.name}
      </p>

      <p className="text-sm text-gray-500">
        {new Date(date).toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
};
