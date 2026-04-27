import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextField } from "@/shared/components/TextField";
import type { ModelDbResponse } from "@/shared/api/model";
import { fetchModelById, trainModelById, updateModelById } from "@/shared/api/model";

export function Model() {
  const { projectId = "0", modelId = "0" } = useParams<{ projectId: string; modelId: string }>();
  const navigate = useNavigate();

  const [model, setModel] = useState<ModelDbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editParams, setEditParams] = useState("");
  const [editFilesIds, setEditFilesIds] = useState("");

  const loadModel = async () => {
    setLoading(true);
    const response = await fetchModelById(projectId, modelId);
    setLoading(false);
    if (response) {
      setModel(response);
      setEditParams(JSON.stringify(response.parameters, null, 2));
      setEditFilesIds(response.files_ids.join(", "));
    }
  };

  useEffect(() => { 
    const loadModel = async () => {
      setLoading(true);
      const response = await fetchModelById(projectId, modelId);
      setLoading(false);
      if (response) {
        setModel(response);
        // Инициализируем поля редактирования данными из БД
        setEditParams(JSON.stringify(response.parameters, null, 2));
        setEditFilesIds(response.files_ids.join(", "));
      }
    };
    loadModel();
  }, [projectId, modelId]);

  const handleSaveSettings = async () => {
  let parsedParams;

  try {
    parsedParams = JSON.parse(editParams);
  } catch {
    toast.error("Некорректный JSON");
    return;
  }

  const parsedFiles = editFilesIds
    .split(",")
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));

  const response = await updateModelById(projectId, modelId, {
    parameters: parsedParams,
    files_ids: parsedFiles
  });

  if (!response) {
    toast.error("Ошибка сохранения");
    return;
  }

  toast.success("Изменения сохранены");
  setModel(response);
  setIsEditing(false);
  loadModel();
};

  const handleTrainClick = async () => {
    if (!model) return;

    if (model.files_ids.length === 0) {
      toast.error("Добавьте ID файлов в настройках перед обучением");
      return;
    }

    setIsTraining(true);
    const response = await trainModelById(projectId, modelId);
    setIsTraining(false);

    if (response === undefined) return;
    toast.success("Модель успешно обучена");
    setModel(response);
  };

  return (
    <div>
      <Header title={model ? `Модель "${model.name}"` : "Загрузка..."} />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage onClick={() => navigate(`/projects/${projectId}/models`)} isLoading={loading} />

        {model && (
          <div className="border border-gray-200 rounded-4xl p-8 bg-white">
            <div className="flex justify-between items-center mb-10 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <div>
                <TextUI variant="title">{model.name}</TextUI>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 text-xs rounded-2xl border ${
                    model.is_draft ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}>
                    {model.is_draft ? "Черновик" : "Обучена"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                {model.is_draft && (
                  <>
                    <ButtonUI variant="secondary" onClick={() => setIsEditing(!isEditing)} className="flex items-center">
                      {isEditing ? "Отмена" : "Настроить"}
                    </ButtonUI>
                    {!isEditing && (
                      <ButtonUI onClick={handleTrainClick} disabled={isTraining}>
                        {isTraining ? "Обучение..." : "Запустить обучение"}
                      </ButtonUI>
                    )}
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <TextUI variant="label">Параметры обучения (JSON)</TextUI>
                  <textarea
                    className="w-full h-48 p-4 mt-2 font-mono text-sm border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={editParams}
                    onChange={(e) => setEditParams(e.target.value)}
                  />
                </div>
                <div>
                  <TextUI variant="label">ID файлов через запятую</TextUI>
                  <div className="mt-2">
                    <TextField value={editFilesIds} setValue={setEditFilesIds} placeholder="Пример: 1, 2, 3" />
                  </div>
                </div>
                <ButtonUI onClick={handleSaveSettings}>Сохранить</ButtonUI>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${!model.is_draft ? "md:grid-cols-2" : ""} gap-8`}>
                {/* Параметры */}
                <div className="p-6 border border-gray-100 rounded-3xl">
                  <TextUI variant="header" className="mb-4">Параметры</TextUI>
                  <div className="space-y-2">
                    {Object.entries(model.parameters).length > 0 ? Object.entries(model.parameters).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-gray-50">
                        <span className="font-mono text-gray-400">{k}</span>
                        <span className="font-medium">{String(v)}</span>
                      </div>
                    )) : <TextUI variant="desc">Параметры не заданы</TextUI>}
                  </div>
                </div>

                {/* Метрики видны только после обучения (!is_draft) */}
                {!model.is_draft && (
                  <div className="p-6 border border-blue-100 bg-blue-50/20 rounded-3xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <TextUI variant="header" className="mb-4 text-blue-700">Метрики обучения</TextUI>
                    <div className="space-y-2">
                      {Object.entries(model.metrics).length > 0 ? Object.entries(model.metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-blue-100/50">
                          <span className="font-mono text-blue-500/70">{k}</span>
                          <span className="text-blue-800 font-bold">{String(v)}</span>
                        </div>
                      )) : <TextUI variant="desc">Метрики не найдены</TextUI>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between text-gray-400 text-xs">
              <span>ID: {model.id} • Файлы: {model.files_ids.length > 0 ? model.files_ids.join(", ") : "не выбраны"}</span>
              <span>Обновлено: {new Date(model.updated_at).toLocaleString("ru-RU")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}