import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProjects,
  createProject,
  patchProjectById,
  deleteProjectById,
  fetchProjectById,
  type Project,
  type PostProjectRequest,
} from "@/shared/api/projects";

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Состояния для модального окна формы
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<PostProjectRequest>({
    name: "",
    description: "",
    is_public: false,
  });

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      if (data && data.data) {
        // проверяем наличие data.data
        setProjects(data.data);
      } else {
        setError("Не удалось загрузить проекты: неверный формат ответа");
      }
    } catch (err) {
      setError(err.message || "Ошибка загрузки проектов");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка списка проектов при монтировании
  useEffect(() => {
    loadProjects();
  }, []);

  // Обработка открытия формы создания
  const handleCreateClick = () => {
    setEditingProject(null);
    setFormData({ name: "", is_public: false, description: "" });
    setIsModalOpen(true);
  };

  // Обработка открытия формы редактирования
  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setFormData({ name: project.name, is_public: false, description: "" });
    setIsModalOpen(true);
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (editingProject) {
      // Обновление проекта
      const updated = await patchProjectById(editingProject.id, formData);
      if (updated) {
        await loadProjects(); // обновляем список
        setIsModalOpen(false);
      } else {
        setError("Ошибка при обновлении проекта");
      }
    } else {
      // Создание проекта
      const created = await createProject(formData);
      if (created) {
        await loadProjects();
        setIsModalOpen(false);
      } else {
        setError("Ошибка при создании проекта");
      }
    }
  };

  // Удаление проекта
  const handleDelete = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить проект?")) return;
    setError(null);
    const result = await deleteProjectById(id);
    if (result?.detail) {
      await loadProjects();
    } else {
      setError("Ошибка при удалении проекта");
    }
  };

  // Обработка изменения полей формы
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 mt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoHome}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-200"
          >
            На главную
          </button>
          <h1 className="text-2xl font-bold">Проекты</h1>
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-200"
        >
          + Новый проект
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Загрузка...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="text-center text-gray-500">Нет проектов</p>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg p-4 shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditClick(project)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-green-600 hover:text-green-800"
                >
                  Перейти в проект
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно формы */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProject ? "Редактировать проект" : "Создать проект"}
            </h2>
            <form onSubmit={handleSubmit}>
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
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingProject ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
