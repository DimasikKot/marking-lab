import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { fetchModelById, type ModelFullResponse } from "@/shared/api/model";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ModelPreview } from "@/shared/components/ModelPreview";

export function ComparisonModels() {
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "0,0";

  // Переменные страницы
  const [model1, setModel1] = useState<ModelFullResponse | null>(null);
  const [model2, setModel2] = useState<ModelFullResponse | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const ids = ids_param
        .split(",") // Разделение на массив
        .map((id) => Number(id)) // Преобразование в число
        .slice(0, 2); // Максимум 2 модели

      setIsLoadingModels(true);
      const response1 = await fetchModelById(projectId, ids[0]);
      const response2 = await fetchModelById(projectId, ids[1]);
      setIsLoadingModels(false);
      if (response1 === undefined || response2 === undefined) return;
      setModel1(response1);
      setModel2(response2);
    };

    loadFiles();
  }, [projectId, ids_param]);

  return (
    <>
      <Header title="Сравнение моделей" />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage onClick={() => window.history.back()} />

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {model1 && model2 ? (
            <ModelsCompareContainer
              projectId={projectId}
              model1={model1}
              model2={model2}
            />
          ) : isLoadingModels ? (
            <TextUI>Загрузка...</TextUI>
          ) : (
            <TextUI>Файлы не найдены</TextUI>
          )}
        </div>
      </div>
    </>
  );
}

const ModelsCompareContainer = ({
  model1,
  model2,
}: {
  projectId: string | number;
  model1: ModelFullResponse;
  model2: ModelFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <ModelPreview model={model1} />
      <ModelPreview model={model2} />
    </div>
  );
};

/*Колонки для моделей (без изменений)*/
function ModelCompareColumn({
  projectId,
  modelId,
}: {
  projectId: string | number;
  modelId: number;
}) {
  const [model, setModel] = useState<ModelDbResponse | null>(null);

  useEffect(() => {
    fetchModelById(projectId, modelId).then((res) => {
      if (res) setModel(res);
    });
  }, [projectId, modelId]);

  if (!model) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-4xl p-6 shadow-sm space-y-6">
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <TextUI variant="header" className="text-blue-600 truncate">
            {model.name}
          </TextUI>
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-600 text-xs font-bold">
            {model.progress}%
          </div>
        </div>
      </div>

      {/* Параметры */}
      <div>
        <TextUI
          variant="title"
          className="text-sm mb-3 text-gray-400 uppercase tracking-wider"
        >
          Параметры
        </TextUI>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(model.parameters).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between text-sm py-2 border-b border-gray-50"
            >
              <span className="text-gray-500">{k}</span>
              <span className="font-medium">{JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-3xl">
        <TextUI
          variant="title"
          className="text-sm mb-3 text-emerald-600 uppercase tracking-wider"
        >
          Метрики
        </TextUI>
        <div className="space-y-2">
          {Object.entries(model.metrics).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between items-center py-1 border-b border-emerald-100/50"
            >
              <span className="text-emerald-800/70 text-sm">{k}</span>
              <span className="text-emerald-700 font-bold">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Графики */}
      <div className="space-y-4">
        <TextUI
          variant="title"
          className="text-sm text-gray-400 uppercase tracking-wider"
        >
          Визуализация
        </TextUI>
        {Object.entries(model.graphs).map(([key, value]) => (
          <div
            key={key}
            className="border border-gray-100 rounded-3xl p-3 bg-gray-50/50"
          >
            <TextUI
              variant="label"
              className="mb-2 block text-center text-xs text-gray-500"
            >
              {key}
            </TextUI>
            <img
              src={value}
              alt={key}
              className="w-full rounded-2xl shadow-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
