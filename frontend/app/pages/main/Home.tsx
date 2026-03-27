import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import logo from "@/assets/logo/logo.svg";

export function Home() {
  const navigate = useNavigate();
  const [messageBackend, setMessageBackend] = useState(
    "Backend контейнер не работает",
  );
  const [messageML, setMessageML] = useState("ML контейнер не работает");
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // начальная тёмная тема

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBackendEcho();
        if (data?.detail === undefined) return;
        setMessageBackend(data.detail);
      } catch (error: unknown) {
        console.error(error);
      }

      try {
        const data = await fetchMLEcho();
        if (data?.detail === undefined) return;
        setMessageML(data.detail);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    load();
  }, []);

  // Определяем цвета для текущей темы
  const isDark = theme === "dark";

  return (
    <div
      className={`h-full w-full flex flex-col p-8 overflow-auto transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Верхняя панель */}
      <div className="grid grid-cols-3 items-center mb-8">
        {/* Левая часть: логотип и название */}
        <div className="flex items-center gap-4">
          <img
            src={logo}
            className="h-24 w-auto object-contain"
            alt="React logo"
          />
          <h1
            className={`text-2xl font-bold rounded-3xl p-4 ${
              isDark ? "bg-red-900 text-white" : "bg-red-200 text-gray-900"
            }`}
          >
            Лаборатория разметки
          </h1>
        </div>

        {/* Правая часть: индикаторы и кнопки */}
        <div className="flex justify-end items-center gap-6">
          {/* Индикаторы состояния контейнеров */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  messageBackend !== "Backend контейнер не работает"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Backend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  messageML !== "ML контейнер не работает"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                ML
              </span>
            </div>
          </div>

          {/* Кнопки входа, регистрации и переключения темы */}
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
              }`}
              onClick={() => navigate("/login")}
            >
              Вход
            </button>
            <button
              className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
              }`}
              onClick={() => navigate("/register")}
            >
              Регистрация
            </button>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
              }`}
              aria-label="Переключить тему"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* Блок с основными кнопками навигации */}
      <div
        className={`flex flex-wrap justify-center items-center gap-4 m-8 rounded-4xl p-4 transition-colors duration-200 ${
          isDark
            ? "bg-gray-800"
            : "bg-gray-100 border border-gray-200 shadow-sm"
        }`}
      >
        <button
          className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          }`}
          onClick={() => navigate("/markup")}
        >
          Страница разметки и загрузки файлов
        </button>
        <button
          className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          }`}
          onClick={() => navigate("/second")}
        >
          Перейти на вторую страницу
        </button>
        <button
          className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          }`}
          onClick={() => navigate("/third")}
        >
          Перейти на третью страницу
        </button>
      </div>
    </div>
  );
}