import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchProjects,
  createProject,
  patchProjectById,
  deleteProjectById,
  type Project,
  type PostProjectRequest,
} from "@/shared/api/projects";
import { Button } from "@/shared/components/Button";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { Header } from "@/shared/components/Header";
import { Text } from "@/shared/components/Text";
import { TextField } from "@/shared/components/TextField";

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Состояния для модального окна формы
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<PostProjectRequest>({
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
  const handleEditClick = (project: Project) => {
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
    } else {
      setLoading(true);
      const response = await createProject(formData);
      setLoading(false);
      if (response === undefined) return;
    }
    loadProjects();
    setIsFormOpen(false);
    setEditingProject(null);
  };

  // Удаление проекта
  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить проект?")) return;

    setLoading(true);
    const response = deleteProjectById(id);
    setLoading(false);
    if (response === undefined) return;
    loadProjects();
  };

  // Обработка изменения полей формы
  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <div>
      <Header>Страница проектов</Header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Button onClick={handleCreateClick}>+ Новый проект</Button>
        </div>

        {loading && <Text variant="desc">Загрузка...</Text>}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard
                project={project}
                handleDeleteClick={() => handleDeleteClick(project.id)}
                handleEditClick={() => handleEditClick(project)}
                handleNavigateClick={() => navigate(`/projects/${project.id}`)}
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

            <div className="flex flex-col gap-4 bg-white rounded-lg shadow-xl w-xl p-6 z-10">
              <Text variant="title">
                {editingProject ? "Редактировать проект" : "Создать проект"}
              </Text>

              <div className="flex flex-col gap-4">
                <div>
                  <Text variant="label">Название</Text>

                  <TextField
                    value={formData.name}
                    onChange={handleFormChange}
                    name="name"
                  />
                </div>

                <div>
                  <Text variant="label">Описание</Text>

                  <TextField
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    isArea={true}
                    rows={4}
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setIsFormOpen(false)}
                    variant="secondary"
                  >
                    Отмена
                  </Button>

                  <Button onClick={handleSubmitClick}>
                    {editingProject ? "Сохранить" : "Создать"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
