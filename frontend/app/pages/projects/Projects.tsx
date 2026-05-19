import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  fetchProjects,
  createProject,
  patchProjectById,
  deleteProjectById,
  type ProjectDbResponse,
  type PatchProjectRequest,
} from "@/shared/api/projects";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { Header } from "@/shared/components/Header";
import { TextUI } from "@/shared/components/TextUI";
import { TextField } from "@/shared/components/TextField";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { CheckboxUI } from "@/shared/components/CheckboxUI";

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDbResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Состояния для модального окна формы
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] =
    useState<ProjectDbResponse | null>(null);

  const [search, setSearch] = useState("");
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  const loadProjects = async () => {
    setIsLoading(true);
    const response = await fetchProjects();
    setIsLoading(false);
    if (response === undefined) return;
    setProjects(response.data);
  };

  // Загрузка списка проектов при монтировании
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      const response = await fetchProjects();
      setIsLoading(false);
      if (response === undefined) return;
      setProjects(response.data);
    };

    loadProjects();
  }, []);

  // Обработка открытия формы создания
  const handleCreateClick = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  // Обработка открытия формы редактирования
  const handleEditClick = (project: ProjectDbResponse) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  // Удаление проекта
  const handleDeleteClick = async (
    project_id: number,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!event || !event.shiftKey) {
      if (!window.confirm("Вы уверены, что хотите удалить этот проект?"))
        return;
    }

    setIsLoading(true);
    const response = await deleteProjectById(project_id);
    setIsLoading(false);
    if (response === undefined) return;
    toast.success("Проект успешно удалён");
    loadProjects();
  };

  return (
    <>
      <Header title="Проекты" />

      <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
        <ButtonPage onClick={() => navigate("/")} isLoading={isLoading} />

        <div className="border border-gray-200 rounded-4xl p-6">
          <div className="mb-4 grid grid-cols-3 items-center gap-4">
            <TextUI variant="header">Ваши проекты</TextUI>

            <TextField
              name="searchProject"
              value={search}
              setValue={setSearch}
              placeholder="Поиск по названию проекта..."
            />

            <div className="flex justify-end items-center">
              <ButtonUI onClick={handleCreateClick}>+ Новый проект</ButtonUI>
            </div>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <TextUI variant="desc">
                {search
                  ? "Проекты по запросу не найдены"
                  : "У вас пока нет проектов"}
              </TextUI>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}?tab=files`}
                  className="flex"
                >
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDeleteClick={(event) =>
                      handleDeleteClick(project.id, event)
                    }
                    onEditClick={() => handleEditClick(project)}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Форма редактирования проекта */}
          {isFormOpen && (
            <ProjectEditForm
              editingProject={editingProject}
              setIsLoading={setIsLoading}
              onSubmitClickSuccess={() => {
                setIsFormOpen(false);
                setEditingProject(null);
                loadProjects();
              }}
              onEscape={() => {
                setIsFormOpen(false);
                setEditingProject(null);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

const ProjectEditForm = ({
  editingProject,
  setIsLoading,
  onSubmitClickSuccess,
  onEscape,
}: {
  editingProject: ProjectDbResponse | null;
  setIsLoading: (value: boolean) => void;
  onSubmitClickSuccess?: () => void;
  onEscape?: () => void;
}) => {
  const [formData, setFormData] = useState<PatchProjectRequest>({
    name: editingProject?.name || "",
    description: editingProject?.description || "",
    is_public: editingProject?.is_public || false,
  });
  // Обработка отправки формы
  const handleSubmitClick = async () => {
    if (editingProject) {
      setIsLoading(true);
      const response = await patchProjectById(editingProject.id, formData);
      setIsLoading(false);
      if (response === undefined) return;
      toast.success("Проект успешно изменён");
    } else {
      setIsLoading(true);
      const response = await createProject(formData);
      setIsLoading(false);
      if (response === undefined) return;
      toast.success("Проект успешно создан");
    }

    onSubmitClickSuccess?.();
  };

  // Обработка изменения полей формы
  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div
        onClick={onEscape}
        className="fixed inset-0 flex bg-black/50 backdrop-blur-[2px]"
      />

      <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl w-xl p-6 z-10">
        <TextUI variant="title">
          {editingProject ? "Редактировать проект" : "Создать проект"}
        </TextUI>

        <div className="flex flex-col gap-4">
          <div>
            <TextUI variant="label">Название</TextUI>

            <TextField
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              onEnter={handleSubmitClick}
              onEscape={onEscape}
              autoFocus
            />
          </div>

          <div>
            <TextUI variant="label">Описание</TextUI>

            <TextField
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              onEnter={handleSubmitClick}
              onEscape={onEscape}
              isArea
              rows={4}
            />
          </div>

          <CheckboxUI
            title="Публичный?"
            value={formData.is_public}
            onClick={() =>
              setFormData({
                ...formData,
                is_public: !formData.is_public,
              })
            }
          />

          <div className="flex justify-between items-center">
            <ButtonUI onClick={onEscape} variant="secondary">
              Отмена
            </ButtonUI>

            <ButtonUI onClick={handleSubmitClick}>
              {editingProject ? "Сохранить изменения" : "Создать проект"}
            </ButtonUI>
          </div>
        </div>
      </div>
    </div>
  );
};
