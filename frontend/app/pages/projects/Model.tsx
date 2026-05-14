import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchFiles, type FileDbResponse } from "@/shared/api/file";
import { CheckboxUI } from "@/shared/components/CheckboxUI";

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
import { FileCard } from "@/shared/components/FileCard";

export function Model() {
  const { projectId = "0", modelId = "0" } = useParams<{
    projectId: string;
    modelId: string;
  }>();
  const navigate = useNavigate();

  const [model, setModel] = useState<ModelDbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  const [allFiles, setAllFiles] = useState<FileDbResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editParams, setEditParams] = useState("");

  const [trainingFilesIds, setTrainingFilesIds] = useState<number[]>([]);
  const [predictionFilesIds, setPredictionFilesIds] = useState<number[]>([]);

  const loadModel = async () => {
    setLoading(true);
    const [modelRes, filesRes] = await Promise.all([
      fetchModelById(projectId, modelId),
      fetchFiles(projectId),
    ]);

    setLoading(false);

    if (modelRes) {
      setModel(modelRes);
      setEditParams(JSON.stringify(modelRes.parameters, null, 2));
      setTrainingFilesIds(modelRes.training_files.map((file) => file.id));
      setPredictionFilesIds(modelRes.prediction_files.map((file) => file.id));
    }
    if (filesRes) {
      setAllFiles(filesRes.data);
    }
  };

  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      const [modelResponse, filesResponse] = await Promise.all([
        fetchModelById(projectId, modelId),
        fetchFiles(projectId),
      ]);
      setLoading(false);

      if (modelResponse === undefined) return;
      setModel(modelResponse);
      setEditParams(JSON.stringify(modelResponse.parameters, null, 2));

      if (!isEditing) {
        setEditParams(JSON.stringify(modelResponse.parameters, null, 2));
        setTrainingFilesIds(
          modelResponse.training_files.map((file) => file.id),
        );
        setPredictionFilesIds(
          modelResponse.prediction_files.map((file) => file.id),
        );
      }

      if (filesResponse) {
        setAllFiles(filesResponse.data);
      }

      if (modelResponse.progress === 0 || modelResponse.progress >= 100) {
        clearInterval(interval);
      }
    };

    loadModel();

    const interval = setInterval(() => {
      loadModel();
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, modelId, isEditing]);

  const handleSaveSettings = async () => {
    let parsedParams;

    try {
      parsedParams = JSON.parse(editParams);
    } catch {
      toast.error("Некорректный JSON");
      return;
    }

    const response = await updateModelById(projectId, modelId, {
      parameters: parsedParams,
      training_files_ids: trainingFilesIds,
      prediction_files_ids: predictionFilesIds,
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

    if (model.training_files.length === 0) {
      toast.error("Добавьте файлы для обучения");
      return;
    }

    setIsTraining(true);
    const response = await trainModelById(projectId, modelId);
    setIsTraining(false);

    if (response === undefined) return;
    setModel(response);
    toast.success("Обучение модели успешно запущено");
    setTimeout(() => window.location.reload(), 5000);
  };

  const toggleFile = (id: number, type: "training" | "for_prediction") => {
    const setter =
      type === "training" ? setTrainingFilesIds : setPredictionFilesIds;
    const current = type === "training" ? trainingFilesIds : predictionFilesIds;

    if (current.includes(id)) {
      setter(current.filter((i) => i !== id));
    } else {
      setter([...current, id]);
    }
  };

  return (
    <div>
      <Header>
        {model && (
          <div className="flex flex-row gap-4 items-center">
            <TextUI variant="header" className="line-clamp-1">
              {model.name}
            </TextUI>

            <TextUI
              variant="label"
              isSpan
              className={`px-3 py-1 rounded-2xl border size-max mt-1 min-w-38 text-center
                ${
                  model.progress === 0
                    ? "bg-amber-100 border-amber-300"
                    : model.progress !== 100
                      ? "bg-cyan-100 border-cyan-300"
                      : "bg-emerald-100 border-emerald-300"
                }`}
            >
              {`${
                model.progress === 0
                  ? "Черновик"
                  : model.progress !== 100
                    ? `Обучается ${model.progress}%`
                    : "Обучена"
              }`}
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
              {!(model.progress > 0 && model.progress < 100) && (
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
                <TextUI variant="title" isSelectable>
                  Файлы, на которых будет обучаться:{" "}
                  <TextUI isSpan className="text-lg" isSelectable>
                    {model.training_files.length > 0
                      ? model.training_files
                          .map((file) => file.name)
                          .join(" , ")
                      : "не выбраны"}
                  </TextUI>
                </TextUI>

                <TextUI variant="title" isSelectable>
                  Файлы, которые будут размечены:{" "}
                  <TextUI isSpan className="text-lg" isSelectable>
                    {model.prediction_files.length > 0
                      ? model.prediction_files
                          .map((file) => file.name)
                          .join(" , ")
                      : "не выбраны"}
                  </TextUI>
                </TextUI>
              </>
            )}

            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <TextUI variant="title" className="mb-2">
                    Выбор файлов, на которых будет обучаться модель
                  </TextUI>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-3 border border-gray-100 rounded-2xl bg-white">
                    {allFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        onClick={() => toggleFile(file.id, "training")}
                      >
                        <CheckboxUI
                          value={trainingFilesIds.includes(file.id)}
                          onClick={() => {}}
                        />
                        <FileCard
                          file={file}
                          variant="compact"
                          onClick={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <TextUI variant="title" className="mb-2">
                    Выбор файлов, которые будут размечены моделью
                  </TextUI>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-3 border border-gray-100 rounded-2xl bg-white">
                    {allFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                        onClick={() => toggleFile(file.id, "for_prediction")}
                      >
                        <CheckboxUI
                          value={predictionFilesIds.includes(file.id)}
                          onClick={() => {}}
                        />
                        <FileCard
                          file={file}
                          variant="compact"
                          onClick={() => {}}
                        />
                      </div>
                    ))}
                  </div>
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
