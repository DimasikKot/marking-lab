import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Создаём инстанс Axios
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // Если сервер использует куки
  headers: { "Content-Type": "application/json" },
});

// Интерцептор запросов (автоматически добавляет токен)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор ответов (обрабатывает 401 и обновляет токен)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token"); // Удаляем токен, если невалидный
      window.location.href = "/login"; // Редирект на страницу входа
    }
    return Promise.reject(error);
  },
);

export default api;
