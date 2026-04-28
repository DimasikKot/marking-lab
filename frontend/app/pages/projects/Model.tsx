import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextField } from "@/shared/components/TextField";
import type { ModelDbResponse } from "@/shared/api/model";
import {
  fetchModelById,
  trainModelById,
  updateModelById,
} from "@/shared/api/model";

export function Model() {
  const { projectId = "0", modelId = "0" } = useParams<{
    projectId: string;
    modelId: string;
  }>();
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
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    const response = await updateModelById(projectId, modelId, {
      parameters: parsedParams,
      files_ids: parsedFiles,
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
      <Header>
        {model && (
          <div className="flex flex-row gap-4 items-center">
            <TextUI variant="header">
              {model ? model.name : "Загрузка..."}
            </TextUI>

            <TextUI
              variant="label"
              isSpan
              className={`px-3 py-1 rounded-2xl border size-max mt-1 ${
                model.is_draft
                  ? "bg-amber-100 border-amber-300"
                  : "bg-emerald-100 border-emerald-300"
              }`}
            >
              {model.is_draft ? "Черновик" : "Обучена"}
            </TextUI>
          </div>
        )}
      </Header>

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}/models`)}
          isLoading={loading}
        />

        {model && (
          <div className="border border-gray-200 rounded-4xl flex flex-col gap-4 p-6 overflow-auto">
            <div className="flex justify-between items-center">
              {model.is_draft && (
                <>
                  <ButtonUI
                    variant="secondary"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center"
                  >
                    {isEditing ? "Отмена" : "Настроить"}
                  </ButtonUI>

                  {!isEditing && (
                    <ButtonUI onClick={handleTrainClick} disabled={isTraining}>
                      {isTraining ? "Обучение..." : "Запустить обучение"}
                    </ButtonUI>
                  )}

                  {isEditing && (
                    <ButtonUI onClick={handleSaveSettings}>Сохранить</ButtonUI>
                  )}
                </>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <TextUI variant="title">Параметры обучения</TextUI>

                  <TextField
                    isArea
                    rows={10}
                    value={editParams}
                    onChange={(e) => setEditParams(e.target.value)}
                  />
                </div>

                <div>
                  <TextUI variant="title">ID файлов через запятую</TextUI>

                  <div>
                    <TextField
                      value={editFilesIds}
                      setValue={setEditFilesIds}
                      placeholder="Пример: 1, 2, 3"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${!model.is_draft ? "md:grid-cols-2" : ""} gap-8`}
              >
                {/* Параметры */}
                <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-3xl">
                  <TextUI variant="header" className="mb-4 text-orange-400">
                    Параметры
                  </TextUI>

                  <div className="space-y-2">
                    {Object.entries(model.parameters).length > 0 ? (
                      Object.entries(model.parameters).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between py-1 border-b border-orange-200"
                        >
                          <TextUI
                            className="text-orange-400"
                            isSpan
                            isSelectable
                          >
                            {k}
                          </TextUI>

                          <TextUI className="text-orange-400">
                            {String(v)}
                          </TextUI>
                        </div>
                      ))
                    ) : (
                      <TextUI>Параметры не заданы</TextUI>
                    )}
                  </div>
                </div>

                {/* Метрики, видны только после обучения (!is_draft) */}
                {!model.is_draft && (
                  <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-3xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <TextUI variant="header" className="mb-4 text-emerald-500">
                      Результаты обучения
                    </TextUI>

                    <div className="space-y-2">
                      {Object.entries(model.metrics).length > 0 ? (
                        Object.entries(model.metrics).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex justify-between py-1 border-b border-emerald-300"
                          >
                            <TextUI
                              className="text-emerald-500"
                              isSpan
                              isSelectable
                            >
                              {k}
                            </TextUI>

                            <TextUI
                              className="text-emerald-500"
                              isSpan
                              isSelectable
                            >
                              {String(v)}
                            </TextUI>
                          </div>
                        ))
                      ) : (
                        <TextUI>Метрики не найдены</TextUI>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="flex justify-between text-gray-400 text-xs">
                <TextUI isSpan variant="title">
                  Файлы:{" "}
                  {model.files_ids.length > 0
                    ? model.files_ids.join(", ")
                    : "не выбраны"}
                </TextUI>
                <TextUI isSpan variant="title">
                  Обновлено:{" "}
                  {new Date(model.updated_at).toLocaleString("ru-RU")}
                </TextUI>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
