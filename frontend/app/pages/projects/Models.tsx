import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  fetchModels,
  createModel,
  updateModelById,
  deleteModelById,
  stopTrainModelById,
  downloadModelById,
} from "@/shared/api/model";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";
import { TextField } from "@/shared/components/TextField";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { ModelCard } from "@/shared/components/ModelCard";
import type {
  ModelListResponse,
  PatchModelFullRequest,
} from "@/shared/api/model";
import { CheckboxUI } from "@/shared/components/CheckboxUI";
import { downloadFileById } from "@/shared/api/file";

export function Models({
  projectId,
  models,
  setModels,
  isLoading,
  setIsLoading,
}: {
  projectId: string | number;
  models: ModelListResponse[];
  setModels: (models: ModelListResponse[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const navigate = useNavigate();

  // Состояния для создания модели
  const [newModelName, setNewModelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Состояния поиска
  const [search, setSearch] = useState("");
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Состояния для редактирования
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<ModelListResponse | null>(
    null,
  );

  // Состояния для сравнения
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const loadModels = async () => {
    setIsLoading(true);
    const response = await fetchModels(projectId);
    setIsLoading(false);
    if (response === undefined) return;
    setModels(response.data);
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      const response = await fetchModels(projectId);
      setIsLoading(false);

      if (response === undefined) return;
      setModels(response.data);

      // Есть ли хотя бы одна модель в процессе обучения
      const hasTrainingModels = response.data.some(
        (model: ModelListResponse) =>
          model.progress > 0 && model.progress < 100,
      );

      // Если ни одна модель не обучается — останавливаем polling
      if (!hasTrainingModels) {
        clearInterval(interval);
      }
    };

    const interval = setInterval(() => {
      loadModels();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Создание новой модели
  const handleCreate = async () => {
    if (!newModelName.trim() || !projectId) return;

    setIsCreating(true);
    const response = await createModel(projectId, { name: newModelName });
    setIsCreating(false);

    if (response === undefined) return;
    toast.success("Модель успешно создана");
    setNewModelName("");
    loadModels();

    navigate(`/projects/${projectId}/models/${response.id}`);
  };

  const handleDownloadClick = async (model: ModelListResponse) => {
    setIsLoading(true);
    const blob = await downloadModelById(projectId, model.id);
    setIsLoading(false);

    if (blob === undefined) return;
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${model.name}.py`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);

    model.training_files.forEach(async (file) => {
      setIsLoading(true);
      const blob = await downloadFileById(projectId, file.id);
      setIsLoading(false);

      if (blob === undefined) return;
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name}.csv`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      URL.revokeObjectURL(url);
    });

    model.prediction_files.forEach(async (file) => {
      setIsLoading(true);
      const blob = await downloadFileById(projectId, file.id);
      setIsLoading(false);

      if (blob === undefined) return;
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name}_prediction.csv`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      URL.revokeObjectURL(url);
    });
  };

  const handleStopClick = async (
    model_id: number,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!event || !event.shiftKey) {
      if (
        !window.confirm(
          "Вы уверены, что хотите остановить обучение этой модели?",
        )
      )
        return;
    }

    setIsLoading(true);
    const response = await stopTrainModelById(projectId, model_id);
    setIsLoading(false);

    if (response === undefined) return;
    toast.success("Обучение модели успешно остановлено");
    loadModels();
  };

  // Удаление модели
  const handleDeleteClick = async (
    model_id: number,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!event || !event.shiftKey) {
      if (!window.confirm("Вы уверены, что хотите удалить эту модель?")) return;
    }

    setIsLoading(true);
    const response = await deleteModelById(projectId, model_id);
    setIsLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно удалена");
    loadModels();
  };

  // Открытие формы редактирования
  const handleEditClick = (model: ModelListResponse) => {
    setEditingModel(model);
    setIsFormOpen(true);
  };

  const handleCopyClick = async (
    model: ModelListResponse,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!projectId) return;

    setIsLoading(true);
    const response = await createModel(projectId, {
      name: `${model.name} (копия)`,
      parameters: model.parameters,
      training_files_ids: model.training_files.map((file) => file.id),
      prediction_files_ids: model.prediction_files.map((file) => file.id),
    });
    setIsLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно скопирована");
    loadModels();

    if (!event || !event.shiftKey) {
      navigate(`/projects/${projectId}/models/${response.id}?editing=true`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
      <ButtonPage
        onClick={() => navigate("/projects")}
        isLoading={isLoading || isCreating}
      />

      {/* Блок создания модели */}
      <div className="mb-8 border border-gray-200 rounded-4xl p-6">
        <TextUI variant="title">Создание модели</TextUI>

        <div className="flex flex-col gap-4 mt-4">
          <TextUI variant="label">Название новой модели</TextUI>

          <div className="flex flex-col items-center sm:flex-row gap-4 max-w-xl">
            <div className="flex-1">
              <TextField
                value={newModelName}
                setValue={setNewModelName}
                onEnter={handleCreate}
                placeholder="Придумайте название для новой модели..."
              />
            </div>

            <ButtonUI
              onClick={handleCreate}
              disabled={!newModelName.trim() || isCreating}
            >
              {isCreating ? "Создание..." : "Создать новую модель"}
            </ButtonUI>
          </div>
        </div>
      </div>

      {/* Список моделей */}
      <div className="border border-gray-200 rounded-4xl p-6">
        <div className="mb-4 grid grid-cols-3 items-center gap-4">
          <TextUI variant="header">Модели проекта</TextUI>

          <TextField
            name="searchModel"
            value={search}
            setValue={setSearch}
            placeholder="Поиск по имени..."
          />

          <div className="flex justify-end items-center gap-4">
            {isCompareMode && (
              <ButtonUI
                disabled={selectedIds.length < 2 || selectedIds.length > 4}
                onClick={() => {
                  navigate(
                    `/projects/${projectId}/models/compare?ids=${selectedIds.join(",")}`,
                  );
                }}
                className="w-fit whitespace-nowrap"
              >
                Сравнить ({selectedIds.length}/4)
              </ButtonUI>
            )}

            <ButtonUI
              variant={isCompareMode ? "secondary" : "primary"}
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setSelectedIds([]);
              }}
            >
              {isCompareMode ? "Отменить" : "Сравнение"}
            </ButtonUI>
          </div>
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <TextUI variant="desc">
              {search
                ? "Модели по запросу не найдены"
                : "В проекте пока нет моделей"}
            </TextUI>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map((model) => {
            const isSelected = selectedIds.includes(model.id);

            return (
              <div key={model.id} className="flex">
                {isCompareMode ? (
                  <div
                    key={model.id}
                    className="flex items-start gap-2 p-2 w-full hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                    onClick={() => toggleSelection(model.id)}
                  >
                    <CheckboxUI value={isSelected} onClick={() => {}} />
                    <ModelCard
                      model={model}
                      variant="compact"
                      className="h-fit"
                    />
                  </div>
                ) : (
                  <Link
                    key={model.id}
                    to={`/projects/${projectId}/models/${model.id}`}
                    className="flex p-2 items-start w-full"
                  >
                    <ModelCard
                      key={model.id}
                      model={model}
                      onEditClick={() => handleEditClick(model)}
                      onCopyClick={(event) => handleCopyClick(model, event)}
                      onDownloadClick={() => handleDownloadClick(model)}
                      onStopClick={(event) => handleStopClick(model.id, event)}
                      onDeleteClick={(event) =>
                        handleDeleteClick(model.id, event)
                      }
                      className="h-full"
                    />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Форма редактирования модели */}
      {isFormOpen && (
        <ModelEditForm
          projectId={projectId}
          editingModel={editingModel}
          setIsLoading={setIsLoading}
          onSubmitClickSuccess={() => {
            setIsFormOpen(false);
            setEditingModel(null);
            loadModels();
          }}
          onEscape={() => {
            setIsFormOpen(false);
            setEditingModel(null);
          }}
        />
      )}
    </div>
  );
}

const ModelEditForm = ({
  projectId,
  editingModel,
  setIsLoading,
  onSubmitClickSuccess,
  onEscape,
}: {
  projectId: string | number;
  editingModel: ModelListResponse | null;
  setIsLoading: (value: boolean) => void;
  onSubmitClickSuccess?: () => void;
  onEscape?: () => void;
}) => {
  const [formData, setFormData] = useState<PatchModelFullRequest>({
    name: editingModel?.name || "",
  });

  // Отправка формы редактирования
  const handleSubmitClick = async () => {
    if (!editingModel || !projectId) return;

    setIsLoading(true);
    const response = await updateModelById(projectId, editingModel.id, {
      name: formData.name,
    });
    setIsLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно изменена");
    onSubmitClickSuccess?.();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div
        onClick={onEscape}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl w-xl p-6 z-10">
        <TextUI variant="title">Редактировать модель</TextUI>

        <div className="flex flex-col gap-4">
          <div>
            <TextUI variant="label">Новое название модели</TextUI>

            <TextField
              value={formData.name || ""}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              onEnter={handleSubmitClick}
              onEscape={onEscape}
              autoFocus
              name="name"
              placeholder="Новое имя..."
            />
          </div>

          <div className="flex justify-between items-center">
            <ButtonUI onClick={onEscape} variant="secondary">
              Отмена
            </ButtonUI>

            <ButtonUI onClick={handleSubmitClick}>Сохранить изменения</ButtonUI>
          </div>
        </div>
      </div>
    </div>
  );
};
