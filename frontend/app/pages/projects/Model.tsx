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
  const [trainingFilesIds, setTrainingFilesIds] = useState("");
  const [predictionFilesIds, setPredictionFilesIds] = useState("");

  const loadModel = async () => {
    setLoading(true);
    const response = await fetchModelById(projectId, modelId);
    setLoading(false);
    if (response) {
      setModel(response);
      setEditParams(JSON.stringify(response.parameters, null, 2));
      setTrainingFilesIds(response.training_files_ids.join(", "));
      setPredictionFilesIds(response.prediction_files_ids.join(", "));
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
        setTrainingFilesIds(response.training_files_ids.join(", "));
        setPredictionFilesIds(response.prediction_files_ids.join(", "));
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

    const parsedTrainingFiles = trainingFilesIds
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    const parsedPredictionFiles = predictionFilesIds
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    const response = await updateModelById(projectId, modelId, {
      parameters: parsedParams,
      training_files_ids: parsedTrainingFiles,
      prediction_files_ids: parsedPredictionFiles,
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

    if (model.training_files_ids.length === 0) {
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
            <TextUI variant="header" maxLines={1}>
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
          onClick={() => navigate(`/projects/${projectId}?tab=models`)}
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

            {!isEditing && (
              <>
                <TextUI isSpan variant="title">
                  Файлы для обучения:{" "}
                  {model.training_files_ids.length > 0
                    ? model.training_files_ids.join(", ")
                    : "не выбраны"}
                </TextUI>

                <TextUI isSpan variant="title">
                  Файлы для предсказания:{" "}
                  {model.prediction_files_ids.length > 0
                    ? model.prediction_files_ids.join(", ")
                    : "не выбраны"}
                </TextUI>
              </>
            )}

            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <TextUI variant="title">ID файлов для обучения</TextUI>

                  <TextField
                    value={trainingFilesIds}
                    setValue={setTrainingFilesIds}
                    placeholder="1, 2, 3"
                  />
                </div>

                <div>
                  <TextUI variant="title">
                    ID файлов которые будут размечены
                  </TextUI>

                  <TextField
                    value={predictionFilesIds}
                    setValue={setPredictionFilesIds}
                    placeholder="1, 2, 3"
                  />
                </div>

                <div>
                  <TextUI variant="title">Параметры обучения</TextUI>

                  <TextField
                    isArea
                    rows={10}
                    value={editParams}
                    onChange={(e) => setEditParams(e.target.value)}
                    placeholder={`{\n\t"Базовая модель": "albert-base-v2"\n\t"Скорость обучения": 0.001,\n\t"Размер батча": 32,\n\t"Эпох": 2,\n\t"Размер валидационного набора": 0.2,\n}`}
                  />
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${Object.entries(model.metrics).length > 0 ? "md:grid-cols-2" : ""} gap-8`}
              >
                {/* Параметры */}
                <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-2xl">
                  <TextUI
                    variant="header"
                    className="mb-4 text-orange-400"
                    isSelectable
                  >
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
