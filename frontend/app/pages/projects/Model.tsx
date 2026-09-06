import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { ModelSettings } from "@/shared/components/ModelSettings";
import { ModelPreview } from "@/shared/components/ModelPreview";
import {
  fetchModelById,
  trainModelById,
  updateModelById,
  type ModelFullResponse,
} from "@/shared/api/model";

export function Model() {
  const navigate = useNavigate();
  const { projectId = "0", modelId = "0" } = useParams<{
    projectId: string;
    modelId: string;
  }>();
  const [searchParams] = useSearchParams();
  const editing_param = Boolean(searchParams.get("editing")) || false;

  const [model, setModel] = useState<ModelFullResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  const [isEditing, setIsEditing] = useState(editing_param);
  const [editParams, setEditParams] = useState("");

  const [trainingFilesIds, setTrainingFilesIds] = useState<number[]>([]);
  const [predictionFilesIds, setPredictionFilesIds] = useState<number[]>([]);

  const loadModel = async () => {
    setIsLoading(true);
    // const [modelRes, filesRes] = await Promise.all([
    //   fetchModelById(projectId, modelId),
    //   fetchFiles(projectId),
    // ]);
    const response = await fetchModelById(projectId, modelId);
    setIsLoading(false);

    if (response) {
      setModel(response);
      setEditParams(JSON.stringify(response.parameters, null, 2));
      setTrainingFilesIds(response.training_files.map((file) => file.id));
      setPredictionFilesIds(response.prediction_files.map((file) => file.id));
    }
  };

  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      // const [modelResponse, filesResponse] = await Promise.all([
      //   fetchModelById(projectId, modelId),
      //   fetchFiles(projectId),
      // ]);
      const response = await fetchModelById(projectId, modelId);
      setIsLoading(false);

      if (response === undefined) return;
      setModel(response);
      setEditParams(JSON.stringify(response.parameters, null, 2));

      if (!isEditing) {
        setEditParams(JSON.stringify(response.parameters, null, 2));
        setTrainingFilesIds(response.training_files.map((file) => file.id));
        setPredictionFilesIds(response.prediction_files.map((file) => file.id));
      }

      if (isEditing && trainingFilesIds.length === 0 && predictionFilesIds.length === 0) {
        setTrainingFilesIds(response.training_files.map((file) => file.id));
        setPredictionFilesIds(response.prediction_files.map((file) => file.id));
      }

      if (response.progress <= 0 || response.progress >= 200) {
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

    if (response === undefined) return;

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
    setTimeout(() => window.location.reload(), 2000);
  };

  return (
    <>
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
                  0 <= model.progress && model.progress <= 2
                    ? "bg-amber-100 border-amber-300"
                    : (3 <= model.progress && model.progress <= 99) ||
                        (101 <= model.progress && model.progress <= 199)
                      ? "bg-cyan-100 border-cyan-300"
                      : "bg-emerald-100 border-emerald-300"
                }`}
            >
              {`${
                model.progress === 0
                  ? "Черновик"
                  : 1 <= model.progress && model.progress <= 2
                    ? "В очереди"
                    : 3 <= model.progress && model.progress <= 99
                      ? `Обучается ${model.progress}%`
                      : 101 <= model.progress && model.progress <= 199
                        ? `Размечает файлы ${model.progress - 100}%`
                        : "Обучена"
              }`}
            </TextUI>
          </div>
        )}
      </Header>

      <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=models`)}
          isLoading={isLoading}
        />

        {/* Кнопки */}
        {model && (
          <div className="border border-gray-200 rounded-4xl flex flex-col gap-4 p-6 overflow-auto">
            {!(model.progress > 0 && model.progress < 100) && (
              <div className="flex justify-between items-center">
                <ButtonUI
                  variant="secondary"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center"
                >
                  {isEditing ? "Отмена" : "Настроить"}
                </ButtonUI>

                {!isEditing && (
                  <ButtonUI onClick={handleTrainClick} disabled={isTraining}>
                    {isTraining ? "Запускается..." : "Запустить обучение"}
                  </ButtonUI>
                )}

                {isEditing && (
                  <ButtonUI onClick={handleSaveSettings}>Сохранить</ButtonUI>
                )}
              </div>
            )}

            {isEditing ? (
              <ModelSettings
                projectId={projectId}
                setIsLoading={setIsLoading}
                editParams={editParams}
                setEditParams={setEditParams}
                trainingFilesIds={trainingFilesIds}
                setTrainingFilesIds={setTrainingFilesIds}
                predictionFilesIds={predictionFilesIds}
                setPredictionFilesIds={setPredictionFilesIds}
              />
            ) : (
              <ModelPreview model={model} projectId={projectId} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
