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

  return (
    <div className="h-full w-full flex flex-col p-8 overflow-auto bg-white text-gray-900">
      {/* Верхняя панель */}
      <div className="grid grid-cols-3 items-center mb-8">
        {/* Левая часть: логотип и название в одной панели */}
        <div className="flex items-center gap-4 rounded-3xl p-4 bg-gray-100 text-gray-900">
          <img
            src={logo}
            className="h-12 w-auto object-contain"
            alt="React logo"
          />
          <h1 className="text-2xl font-bold">
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
              <span className="text-sm text-gray-600">Backend</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  messageML !== "ML контейнер не работает"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">ML</span>
            </div>
          </div>

          {/* Кнопки входа и регистрации */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
              onClick={() => navigate("/login")}
            >
              Вход
            </button>
            <button
              className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
              onClick={() => navigate("/register")}
            >
              Регистрация
            </button>
          </div>
        </div>
      </div>

      {/* Блок с основными кнопками навигации */}
      <div className="flex flex-wrap justify-center items-center gap-4 m-8 rounded-4xl p-4 bg-gray-100 border border-gray-200 shadow-sm">
        <button
          className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          onClick={() => navigate("/markup")}
        >
          Страница разметки и загрузки файлов
        </button>
        <button
          className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          onClick={() => navigate("/second")}
        >
          Перейти на вторую страницу
        </button>
        <button
          className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
          onClick={() => navigate("/third")}
        >
          Перейти на третью страницу
        </button>
      </div>
    </div>
  );
}