import { TextUI } from "@/shared/components/TextUI";
import type { ModelFullResponse } from "@/shared/api/model";

export const ModelPreview = ({ model }: { model: ModelFullResponse }) => {
  return (
    <div
      className={`grid grid-cols-1 ${Object.entries(model.metrics).length > 0 ? "md:grid-cols-2" : ""} gap-8`}
    >
      {/* Параметры */}
      <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-2xl">
        <TextUI variant="header" className="mb-4 text-orange-400" isSelectable>
          Параметры обучения
        </TextUI>

        <div className="space-y-2">
          {Object.entries(model.parameters).length > 0 &&
            Object.entries(model.parameters).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between py-1 border-b border-orange-200"
              >
                <TextUI
                  variant="subtitle"
                  className="text-orange-400 w-[45%] overflow-hidden"
                  isSelectable
                >
                  {k}
                </TextUI>

                <TextUI
                  className="text-orange-400 w-[50%] overflow-hidden"
                  isSpan
                  isSelectable
                >
                  {String(v)}
                </TextUI>
              </div>
            ))}
        </div>
      </div>

      {/* Метрики */}
      {Object.entries(model.metrics).length > 0 && (
        <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-2xl">
          <TextUI
            variant="header"
            className="mb-4 text-emerald-500"
            isSelectable
          >
            Результаты обучения
          </TextUI>

          <div className="space-y-2">
            {Object.entries(model.metrics).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between py-1 border-b border-emerald-300"
              >
                <TextUI
                  variant="subtitle"
                  className="text-emerald-500 w-[45%] overflow-hidden"
                  isSelectable
                >
                  {k}
                </TextUI>

                <TextUI
                  className="text-emerald-500 w-[50%] overflow-hidden"
                  isSpan
                  isSelectable
                >
                  {String(v)}
                </TextUI>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Графики */}
      {Object.entries(model.graphs).map(([key, value]) => (
        <div key={key} className="border rounded-2xl p-3">
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

      <TextUI variant="title" isSelectable>
        Файлы, на которых будет обучаться:{" "}
        <TextUI isSpan className="text-lg" isSelectable>
          {model.training_files.length > 0
            ? model.training_files.map((file) => file.name).join(" , ")
            : "не выбраны"}
        </TextUI>
      </TextUI>

      <TextUI variant="title" isSelectable>
        Файлы, которые будут размечены:{" "}
        <TextUI isSpan className="text-lg" isSelectable>
          {model.prediction_files.length > 0
            ? model.prediction_files.map((file) => file.name).join(" , ")
            : "не выбраны"}
        </TextUI>
      </TextUI>
    </div>
  );
};
