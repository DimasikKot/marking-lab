import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState<boolean>(false);

  // Состояния для модального окна формы
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] =
    useState<ProjectDbResponse | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<PatchProjectRequest>({
    name: "",
    description: "",
    is_public: false,
  });

  const loadProjects = async () => {
    setLoading(true);
    const response = await fetchProjects();
    setLoading(false);
    if (response === undefined) return;
    setProjects(response.data);
  };

  // Загрузка списка проектов при монтировании
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const response = await fetchProjects();
      setLoading(false);
      if (response === undefined) return;
      setProjects(response.data);
    };

    loadProjects();
  }, []);

  // Обработка открытия формы создания
  const handleCreateClick = () => {
    setEditingProject(null);
    setFormData({ name: "", is_public: false, description: "" });
    setIsFormOpen(true);
  };

  // Обработка открытия формы редактирования
  const handleEditClick = (project: ProjectDbResponse) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      is_public: project.is_public,
    });
    setIsFormOpen(true);
  };

  // Обработка отправки формы
  const handleSubmitClick = async () => {
    if (editingProject) {
      setLoading(true);
      const response = await patchProjectById(editingProject.id, formData);
      setLoading(false);
      if (response === undefined) return;
      toast.success("Проект успешно изменён");
    } else {
      setLoading(true);
      const response = await createProject(formData);
      setLoading(false);
      if (response === undefined) return;
      toast.success("Проект успешно создан");
    }
    loadProjects();
    setIsFormOpen(false);
    setEditingProject(null);
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

    setLoading(true);
    const response = await deleteProjectById(project_id);
    setLoading(false);
    if (response === undefined) return;
    toast.success("Проект успешно удалён");
    loadProjects();
  };

  // Обработка изменения полей формы
  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <Header title="Проекты" />

      <div className="max-w-6xl mx-auto m-2 mb-80">
        <ButtonPage onClick={() => navigate("/")} isLoading={loading} />

        <div className="border border-gray-200 rounded-4xl p-6">
          <div className="mb-4 flex justify-between items-center">
            <TextUI variant="header" className="max-w-xs w-full">
              Файлы проекта
            </TextUI>

            <ButtonUI onClick={handleCreateClick} className="max-w-xs w-full">
              + Новый проект
            </ButtonUI>

            <div className="max-w-xs w-full">
              <TextField
                name="searchProject"
                value={search}
                setValue={setSearch}
                placeholder="Поиск по названию проекта..."
              />
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}?tab=files`)}
                  onDeleteClick={() => handleDeleteClick(project.id)}
                  onEditClick={() => handleEditClick(project)}
                />
              ))}
            </div>
          )}

          {/* Модальное окно формы */}
          {isFormOpen && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div
                onClick={() => setIsFormOpen(false)}
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
                      onEscape={() => setIsFormOpen(false)}
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
                      onEscape={() => setIsFormOpen(false)}
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
                    <ButtonUI
                      onClick={() => setIsFormOpen(false)}
                      variant="secondary"
                    >
                      Отмена
                    </ButtonUI>

                    <ButtonUI onClick={handleSubmitClick}>
                      {editingProject
                        ? "Сохранить изменения"
                        : "Создать проект"}
                    </ButtonUI>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
