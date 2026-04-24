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
        bg-white border border-gray-300 rounded-2xl p-4 gap-3
        hover:border-gray-400 hover:shadow-md transition-all duration-200
        cursor-pointer flex flex-col justify-between
        ${className}
      `}
    >
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

      {Object.entries(model.graphs).map(([key, value]) => (
        <div key={key}>
          <p>{key}</p>
          <img src={value} alt={key} />
        </div>
      ))}
    </div>
  );
};
