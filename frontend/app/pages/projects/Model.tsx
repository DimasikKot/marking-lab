import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import type { ModelDbResponse } from "@/shared/api/model";
import { fetchModelById, trainModelById } from "@/shared/api/model";

export function Model() {
  const { projectId = "0", modelId = "0" } = useParams<{ projectId: string; modelId: string }>();
  const navigate = useNavigate();

  const [model, setModel] = useState<ModelDbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  const loadModel = async () => {
    setLoading(true);
    const response = await fetchModelById(projectId, modelId);
    setLoading(false);
    if (response === undefined) return;
    setModel(response);
  };

  useEffect(() => {
    const loadModel = async () => {
    setLoading(true);
    const response = await fetchModelById(projectId, modelId);
    setLoading(false);
    if (response === undefined) return;
    setModel(response);
  };
    loadModel();
  }, [projectId, modelId]);

  const handleTrainClick = async () => {
    if (!model || !projectId) return;
    if (!model.is_draft) {
      toast.error("Нельзя обучать уже обученную модель");
      return;
    }
    if (model.files_ids.length === 0) {
      toast.error("Сначала прикрепите файлы к модели для обучения");
      return;
    }

    setIsTraining(true);
    const response = await trainModelById(projectId, Number(modelId));
    setIsTraining(false);

    if (response === undefined) return;
    toast.success("Модель успешно обучена!");
    loadModel();
    setModel(response);
  };

  return (
    <div>
      <Header title={model ? `Модель "${model.name}"` : "Загрузка модели..."} />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}/models`)}
          isLoading={loading}
        />

        {model && (
          <div className="border border-gray-200 rounded-4xl p-8 overflow-auto">
            {/* Статус и действия */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100">
              <div className="flex flex-col gap-2 mb-4 md:mb-0">
                <TextUI variant="title">{model.name}</TextUI>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-mono rounded-2xl border ${
                    model.is_draft 
                      ? "bg-amber-100 text-amber-700 border-amber-200" 
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}>
                    {model.is_draft ? "Черновик (Требует обучения)" : "Обучена"}
                  </span>
                  {model.saved_in_memory && (
                    <span className="px-3 py-1 text-xs font-mono rounded-2xl border bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                      <span className="material-icons text-[14px]">cloud</span> В памяти
                    </span>
                  )}
                </div>
              </div>

              {model.is_draft && (
                <ButtonUI 
                  onClick={handleTrainClick} 
                  disabled={isTraining || model.files_ids.length === 0}
                >
                  {isTraining ? "Идет обучение..." : "Запустить обучение"}
                </ButtonUI>
              )}
            </div>

            {/* Сетка параметров и метрик */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Параметры */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <TextUI variant="header" className="text-xl mb-4">Параметры</TextUI>
                {Object.keys(model.parameters || {}).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(model.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-50 pb-2">
                        <TextUI variant="desc" className="font-mono">{key}</TextUI>
                        <TextUI variant="normal">{String(value)}</TextUI>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TextUI variant="desc">Параметры не заданы</TextUI>
                )}
              </div>

              {/* Метрики */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <TextUI variant="header" className="text-xl! mb-4">Метрики</TextUI>
                {Object.keys(model.metrics || {}).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(model.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-50 pb-2">
                        <TextUI variant="desc" className="font-mono">{key}</TextUI>
                        <TextUI variant="normal" className="text-blue-600">{String(value)}</TextUI>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TextUI variant="desc">
                    {model.is_draft ? "Метрики появятся после обучения" : "Нет данных о метриках"}
                  </TextUI>
                )}
              </div>
            </div>

            <div className="mt-10 flex justify-between px-2 pt-6 border-t border-gray-100">
              <TextUI variant="desc">
                ID модели: {model.id} • Прикрепленных файлов: {model.files_ids.length}
              </TextUI>
              <TextUI variant="desc">
                Обновлено: {new Date(model.updated_at).toLocaleString("ru-RU")}
              </TextUI>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}