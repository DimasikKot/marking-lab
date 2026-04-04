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
      <Header>Проекты</Header>

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6 mt-8">
          <Button onClick={handleCreateClick}>+ Новый проект</Button>
        </div>

        {loading && <Text variant="description">Загрузка...</Text>}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
              <Text variant="title">
                {editingProject ? "Редактировать проект" : "Создать проект"}
              </Text>

              <div>
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Название
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Описание
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
