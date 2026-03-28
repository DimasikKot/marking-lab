import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import logo from "@/assets/logo/logo.svg";
import { logoutUser } from "@/shared/api/user";
import { PrimaryButton } from "@/pages/main/Components";

export function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const [messageBackend, setMessageBackend] = useState(
    "Backend контейнер не работает",
  );
  const [messageML, setMessageML] = useState("ML контейнер не работает");
  const handleLogout = () => {
    logoutUser(); // функция выхода (очистка токена, состояния и т.п.)
    setShowMenu(false);
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

  return (
    <div className="h-full w-full flex flex-col p-8 overflow-auto bg-white text-gray-900">
      {/* Верхняя панель */}
      <div className="flex items-center justify-between mb-8">
        {/* Левая часть: логотип и название */}
        <div className="flex items-center gap-4 rounded-3xl p-4">
          <img
            src={logo}
            className="h-12 w-auto object-contain"
            alt="React logo"
          />
          <h1 className="text-2xl font-bold">Лаборатория разметки</h1>
        </div>

        {/* Правая часть: индикаторы и кнопки */}
        <div className="flex items-center gap-4 rounded-3xl p-4">
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
            <PrimaryButton onClick={() => navigate("/components")}>
              Компоненты
            </PrimaryButton>
          </div>
          {/* Кнопки входа и регистрации */}
          <div className="flex gap-2">
            {username ? (
              <div className="relative">
                <button
                  className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center hover:bg-blue-600 transition"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  {username[0].toUpperCase()}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="px-4 py-2 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
                onClick={() => navigate("/login")}
              >
                Вход
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Блок с основными кнопками навигации */}
      <button
        onClick={() => navigate("/projects")}
        className="p-4 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
      >
        Создать проект
      </button>
    </div>
  );
}
