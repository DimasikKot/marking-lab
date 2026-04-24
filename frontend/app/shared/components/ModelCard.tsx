import toast from "react-hot-toast";

import type { ModelDbResponse } from "@/shared/api/model";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "./ButtonUI";

type ModelCardProps = {
  model: ModelDbResponse;
  onClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  dateIsCreatedAt?: boolean;
  className?: string;
};

export const ModelCard = ({
  model,
  onClick = () => toast.error("Обработка нажатия не настроена"),
  onEditClick = () => toast.error("Обработка редактирования не настроена"),
  onDeleteClick = () => toast.error("Обработка удаления не настроена"),
  dateIsCreatedAt = false,
  className = "",
}: ModelCardProps) => {
  const date = dateIsCreatedAt ? model.created_at : model.updated_at;

  return (
    <div
      onClick={onClick}
      className={`
        relative group
        bg-white border border-gray-300 rounded-2xl p-4 gap-3
        hover:border-gray-400 hover:shadow-md transition-all duration-200
        cursor-pointer flex flex-col justify-between
        ${className}
      `}
    >
      {/* Основной контент */}
      <div className="flex flex-row gap-4">
        <div className="flex-1 -mt-2">
          <TextUI variant="title">{model.name}</TextUI>

          {Object.entries(model.parameters).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center select-none material-icons">
          {model.is_draft ? "verified" : "not_interested"}
        </div>

        <div className="flex items-center justify-center select-none material-icons">
          {model.saved_in_memory ? "verified" : "not_interested"}
        </div>
      </div>

      <div className="w-full border-b border-gray-300" />

      <div className="flex justify-between -mb-1 gap-3">
        <ButtonUI
          onClick={onEditClick}
          variant="secondary"
          className="flex-max text-left text-blue-600 hover:text-blue-800"
        >
          <div className="select-none material-icons">edit</div>
        </ButtonUI>

        <TextUI
          variant="desc"
          className="flex-1 text-center justify-end items-end"
        >
          {new Date(date).toLocaleDateString("ru-RU", {
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </TextUI>

        <ButtonUI
          onClick={onDeleteClick}
          variant="secondary"
          className="flex-max text-right text-red-600 hover:text-red-800"
        >
          <div className="select-none material-icons">delete</div>
        </ButtonUI>
      </div>

      {/* ОВЕРЛЕЙ С ГРАФИКАМИ */}
      <div
        className="
          absolute inset-0
          bg-white/95 backdrop-blur-sm
          rounded-2xl p-4
          opacity-0 pointer-events-none
          group-hover:opacity-100 group-hover:pointer-events-auto
          transition-all duration-200
          overflow-auto
          z-10
        "
        onClick={(e) => e.stopPropagation()}
      >
        {Object.entries(model.graphs).map(([key, value]) => (
          <div key={key} className="mb-4">
            <p className="font-semibold mb-2">{key}</p>
            <img src={value} alt={key} className="w-full rounded-lg border" />
          </div>
        ))}
      </div>
    </div>
  );
};
