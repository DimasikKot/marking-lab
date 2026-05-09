import type { ModelDbResponse } from "../api/model";
import { ButtonUI } from "./ButtonUI";
import { TextUI } from "./TextUI";

export const ModelModalCard = ({
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
          bg-white rounded-2xl p-6 gap-4
          w-[90%] max-w-6xl max-h-[90vh]
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
          {/* Параметры */}
          <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-3xl">
            <TextUI
              variant="header"
              className="mb-4 text-orange-400"
              isSelectable
            >
              Параметры
            </TextUI>

            <div className="space-y-2">
              {Object.entries(model.parameters).length > 0 ? (
                Object.entries(model.parameters).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-1 border-b border-orange-200"
                  >
                    <TextUI className="text-orange-400" isSelectable>
                      {k}
                    </TextUI>

                    <TextUI className="text-orange-400" isSpan isSelectable>
                      {String(v)}
                    </TextUI>
                  </div>
                ))
              ) : (
                <TextUI>Параметры не заданы</TextUI>
              )}
            </div>
          </div>

          {/* Метрики */}
          <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-3xl">
            <TextUI
              variant="header"
              className="mb-4 text-emerald-500"
              isSelectable
            >
              Результаты обучения
            </TextUI>

            <div className="space-y-2">
              {Object.entries(model.metrics).length > 0 ? (
                Object.entries(model.metrics).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-1 border-b border-emerald-300"
                  >
                    <TextUI className="text-emerald-500" isSelectable>
                      {k}
                    </TextUI>

                    <TextUI className="text-emerald-500" isSpan isSelectable>
                      {String(v)}
                    </TextUI>
                  </div>
                ))
              ) : (
                <TextUI>Метрики не найдены</TextUI>
              )}
            </div>
          </div>

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
