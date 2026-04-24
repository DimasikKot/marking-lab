import toast from "react-hot-toast";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const date = dateIsCreatedAt ? model.created_at : model.updated_at;

  return (
    <>
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
              <TextUI variant="desc" key={key}>
                <strong>{key}:</strong> {String(value)}
              </TextUI>
            ))}
          </div>

          <div className="flex items-center justify-center select-none material-icons">
            {model.is_draft
              ? "edit"
              : model.saved_in_memory
                ? "cloud"
                : "cloud_off"}
          </div>
        </div>

        <div className="w-full flex-1 border-b border-gray-300" />

        <div className="flex justify-between -mb-1 gap-3">
          <div className="flex flex-max gap-3">
            <ButtonUI
              onClick={onEditClick}
              variant="secondary"
              className="text-left"
            >
              <div className="select-none material-icons">edit</div>
            </ButtonUI>

            {Object.keys(model.graphs).length != 0 && (
              <ButtonUI onClick={() => setIsOpen(true)} variant="secondary">
                <div className="select-none material-icons">insert_chart</div>
              </ButtonUI>
            )}
          </div>

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
            <div
              className={`${Object.keys(model.graphs).length != 0 ? "ml-9" : ""} select-none material-icons`}
            >
              delete
            </div>
          </ButtonUI>
        </div>
      </div>

      {isOpen && <GraphsModal model={model} onClose={() => setIsOpen(false)} />}
    </>
  );
};

const GraphsModal = ({
  model,
  onClose,
}: {
  model: ModelDbResponse;
  onClose: () => void;
}) => {
  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-[1px]
        flex items-center justify-center
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white rounded-2xl p-6
          w-[90%] max-w-5xl max-h-[90vh]
          overflow-auto
          shadow-xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <TextUI variant="title">{model.name}</TextUI>

          <ButtonUI
            onClick={onClose}
            variant="secondary"
            className="material-icons text-gray-600 hover:text-black"
          >
            close
          </ButtonUI>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(model.graphs).map(([key, value]) => (
            <div key={key} className="border rounded-xl p-3">
              <TextUI className="mb-2" isSelectable>
                {key}
              </TextUI>
              <img
                src={value}
                alt={key}
                className="w-full select-none rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
