import toast from "react-hot-toast";
import { useState } from "react";

import type { ModelDbResponse } from "@/shared/api/model";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "./ButtonUI";
import { ModelModalCard } from "./ModelModalCard";

type ModelCardProps = {
  model: ModelDbResponse;
  onClick?: () => void;
  onEditClick?: () => void;
  onCopyClick?: React.MouseEventHandler<HTMLButtonElement>;
  onDeleteClick?: React.MouseEventHandler<HTMLButtonElement>;
  dateIsCreatedAt?: boolean;
  className?: string;
};

export const ModelCard = ({
  model,
  onClick = () => toast.error("Обработка нажатия не настроена"),
  onEditClick = () => toast.error("Обработка редактирования не настроена"),
  onCopyClick = () => toast.error("Обработка копирования не настроена"),
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
        <div className="flex-1 h-full">
          <div className="flex flex-row justify-between gap-4">
            <div className="flex flex-row gap-2">
              <TextUI variant="title" maxLines={1} className="-mt-1">
                {model.name}
              </TextUI>

              <TextUI
                variant="desc"
                className="flex items-end mt-0.5 h-min w-26"
              >
                (id: {model.id})
              </TextUI>
            </div>

            <div
              className={`flex items-center justify-center select-none material-icons
              ${model.is_draft ? "text-amber-500" : "text-emerald-500"}`}
            >
              {model.is_draft
                ? "edit"
                : model.saved_in_memory
                  ? "cloud"
                  : "cloud_off"}
            </div>
          </div>

          <div className="mt-1 flex max-h-[20vh] overflow-auto">
            {Object.entries(model.parameters).length > 0 && (
              <div className="flex-1 w-[50%]">
                {Object.entries(model.parameters).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between px-1 border-b border-orange-200"
                  >
                    <TextUI
                      variant="desc"
                      className="text-orange-400 w-[45%] overflow-hidden"
                    >
                      {k}
                    </TextUI>

                    <TextUI
                      variant="desc"
                      className="text-orange-400 w-[50%] overflow-hidden"
                      isSpan
                    >
                      {String(v)}
                    </TextUI>
                  </div>
                ))}
              </div>
            )}

            {Object.entries(model.metrics).length > 0 && (
              <div className="flex-1 w-[50%]">
                {Object.entries(model.metrics).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between px-1 border-b border-emerald-300"
                  >
                    <TextUI
                      variant="desc"
                      className="text-green-500/90 w-[45%] overflow-hidden"
                    >
                      {k}
                    </TextUI>

                    <TextUI
                      variant="desc"
                      className="text-green-500/90 w-[50%] overflow-hidden"
                      isSpan
                      maxLines={1}
                    >
                      {String(v)}
                    </TextUI>
                  </div>
                ))}
              </div>
            )}
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

            <ButtonUI onClick={(event) => onCopyClick?.(event)} variant="secondary">
              <div className="select-none material-icons">copy_all</div>
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

      {isOpen && (
        <ModelModalCard model={model} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
