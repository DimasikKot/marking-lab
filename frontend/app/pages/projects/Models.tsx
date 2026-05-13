import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  fetchModels,
  createModel,
  updateModelById,
  deleteModelById,
} from "@/shared/api/model";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";
import { TextField } from "@/shared/components/TextField";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { ModelCard } from "@/shared/components/ModelCard";
import type { ModelDbResponse } from "@/shared/api/model";

export function Models({
  projectId,
  models,
  setModels,
  loading,
  setLoading,
}: {
  projectId: string | number;
  models: ModelDbResponse[];
  setModels: (models: ModelDbResponse[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const navigate = useNavigate();

  // Состояния для создания модели
  const [newModelName, setNewModelName] = useState("");
  const [creating, setCreating] = useState(false);

  // Состояния поиска
  const [search, setSearch] = useState("");

  // Состояния для редактирования
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<ModelDbResponse | null>(
    null,
  );
  const [formData, setFormData] = useState({ name: "" });

  const loadModels = async () => {
    setLoading(true);
    const response = await fetchModels(projectId);
    setLoading(false);
    if (response === undefined) return;
    setModels(response.data);
  };

  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      const response = await fetchModels(projectId);
      setLoading(false);

      if (response === undefined) return;
      setModels(response.data);

      // Есть ли хотя бы одна модель в процессе обучения
      const hasTrainingModels = response.data.some(
        (model: ModelDbResponse) => model.progress > 0 && model.progress < 100,
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

    setCreating(true);
    const response = await createModel(projectId, { name: newModelName });
    setCreating(false);

    if (response === undefined) return;
    toast.success("Модель успешно создана");
    setNewModelName("");
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

    setLoading(true);
    const response = await deleteModelById(projectId, model_id);
    setLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно удалена");
    loadModels();
  };

  // Открытие формы редактирования
  const handleEditClick = (model: ModelDbResponse) => {
    setEditingModel(model);
    setFormData({ name: model.name });
    setIsFormOpen(true);
  };

  // Отправка формы редактирования
  const handleSubmitClick = async () => {
    if (!editingModel || !projectId) return;

    setLoading(true);
    const response = await updateModelById(projectId, editingModel.id, {
      name: formData.name,
    });
    setLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно изменена");
    setIsFormOpen(false);
    setEditingModel(null);
    loadModels();
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCopyClick = async (
    model: ModelDbResponse,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!projectId) return;

    setLoading(true);
    const response = await createModel(projectId, {
      name: `${model.name} (copy)`,
      parameters: model.parameters,
      training_files_ids: model.training_files_ids,
      prediction_files_ids: model.prediction_files_ids,
    });
    setLoading(false);

    if (response === undefined) return;
    toast.success("Модель успешно скопирована");
    loadModels();

    if (!event || !event.shiftKey) {
      navigate(`/projects/${projectId}/models/${response.id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <ButtonPage
        onClick={() => navigate("/projects")}
        isLoading={loading || creating}
      />

      {/* Блок создания модели */}
      <div className="mb-8 border border-gray-200 rounded-4xl p-6">
        <TextUI variant="title">Создание модели</TextUI>

        <div className="flex flex-col gap-4 mt-4">
          <TextUI variant="label">Название новой модели</TextUI>

          <div className="flex flex-row gap-4 max-w-xl">
            <div className="flex-1">
              <TextField
                value={newModelName}
                setValue={setNewModelName}
                onEnter={handleCreate}
                placeholder="Введите имя модели..."
              />
            </div>
            <ButtonUI
              onClick={handleCreate}
              disabled={!newModelName.trim() || creating}
            >
              {creating ? "Создание..." : "Создать"}
            </ButtonUI>
          </div>
        </div>
      </div>

      {/* Список моделей */}
      <div className="border border-gray-200 rounded-4xl p-6">
        <div className="mb-4 flex justify-between items-center">
          <TextUI variant="header">Модели проекта</TextUI>

          <div className="max-w-xs w-full">
            <TextField
              name="searchModel"
              value={search}
              setValue={setSearch}
              placeholder="Поиск по имени..."
            />
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
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onClick={() =>
                navigate(`/projects/${projectId}/models/${model.id}`)
              }
              onEditClick={() => handleEditClick(model)}
              onCopyClick={(event) => handleCopyClick(model, event)}
              onDeleteClick={(event) => handleDeleteClick(model.id, event)}
            />
          ))}
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl w-xl p-6 z-10">
            <TextUI variant="title">Редактировать модель</TextUI>

            <div className="flex flex-col gap-4">
              <div>
                <TextUI variant="label">Новое название модели</TextUI>
                <TextField
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  onEnter={handleSubmitClick}
                  onEscape={() => {
                    setIsFormOpen(false);
                    setEditingModel(null);
                  }}
                  autoFocus
                  name="name"
                  placeholder="Новое имя..."
                />
              </div>

              <div className="flex justify-between items-center">
                <ButtonUI
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingModel(null);
                  }}
                  variant="secondary"
                >
                  Отмена
                </ButtonUI>

                <ButtonUI onClick={handleSubmitClick}>
                  Сохранить изменения
                </ButtonUI>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
