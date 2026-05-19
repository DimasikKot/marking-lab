import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { TextUI } from "@/shared/components/TextUI";
import { TextField } from "@/shared/components/TextField";
import { FileCard } from "@/shared/components/FileCard";
import type { JsonValue } from "@/shared/api/model";
import { fetchFiles, type FileListResponse } from "@/shared/api/file";
import { CheckboxUI } from "@/shared/components/CheckboxUI";

const BASE_MODELS: string[] = JSON.parse(
  import.meta.env.VITE_BASE_MODELS || "[]",
);

const CLEAR_PARAMETERS: Record<string, JsonValue> = JSON.parse(
  import.meta.env.VITE_CLEAR_PARAMETERS || "{}",
);

export const ModelSettings = ({
  projectId,
  setIsLoading,
  editParams,
  setEditParams,
  trainingFilesIds,
  setTrainingFilesIds,
  predictionFilesIds,
  setPredictionFilesIds,
}: {
  projectId: number | string;
  setIsLoading: (value: React.SetStateAction<boolean>) => void;
  editParams: string;
  setEditParams: (value: React.SetStateAction<string>) => void;
  trainingFilesIds: number[];
  setTrainingFilesIds: (value: React.SetStateAction<number[]>) => void;
  predictionFilesIds: number[];
  setPredictionFilesIds: (value: React.SetStateAction<number[]>) => void;
}) => {
  const [files, setFiles] = useState<FileListResponse[]>([]);

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      const response = await fetchFiles(projectId);
      setIsLoading(false);

      if (response) {
        setFiles(response.data);
      }
    };

    loadFiles();
  }, [projectId, setIsLoading]);

  const changeBaseModel = async (model: string) => {
    try {
      const parsed = JSON.parse(editParams || "{}");

      parsed["Базовая модель"] = model;

      setEditParams(JSON.stringify(parsed, null, 2));
    } catch {
      toast.error("Некорректный JSON");
    }
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
    <div className="flex flex-col gap-4">
      <TextUI variant="title">Выбор базовой модели</TextUI>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {BASE_MODELS.map((model) => {
          let isActive = false;

          try {
            const parsed = JSON.parse(editParams || "{}");
            isActive = parsed["Базовая модель"] === model;
          } catch {
            console.error("Некорректный JSON");
          }

          return (
            <button
              key={model}
              type="button"
              onClick={() => changeBaseModel(model)}
              className={`
                px-3 py-1.5 rounded-lg border transition-all duration-200 
                ${
                  isActive
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }
                `}
            >
              {model}
            </button>
          );
        })}
      </div>

      <div>
        <TextUI variant="title">Параметры обучения</TextUI>

        <TextField
          isArea
          rows={10}
          value={editParams}
          onChange={(e) => setEditParams(e.target.value)}
          placeholder={JSON.stringify(CLEAR_PARAMETERS, null, 2)}
        />
      </div>

      <div>
        <TextUI variant="title" className="mb-2">
          Выбор файлов, на которых будет обучаться модель
        </TextUI>

        <div className="border border-gray-300 rounded-2xl bg-white overflow-clip">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-96 p-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                onClick={() => toggleFile(file.id, "training")}
              >
                <CheckboxUI
                  value={trainingFilesIds.includes(file.id)}
                  onClick={() => {}}
                />
                <FileCard file={file} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <TextUI variant="title" className="mb-2">
          Выбор файлов, которые будут размечены моделью
        </TextUI>

        <div className="border border-gray-300 rounded-2xl bg-white overflow-clip">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-96 p-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                onClick={() => toggleFile(file.id, "for_prediction")}
              >
                <CheckboxUI
                  value={predictionFilesIds.includes(file.id)}
                  onClick={() => {}}
                />
                <FileCard file={file} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
