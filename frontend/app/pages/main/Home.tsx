import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import logo from "@/assets/logo/logo.svg";
import { logoutUser } from "@/shared/api/user";
import { InfoCard } from "@/shared/components/InfoCard";
import { CenterButton } from "@/shared/components/CenterButton";


export function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const username = localStorage.getItem("username");
  const created_at = localStorage.getItem("created_at");
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
      <div className="flex items-center justify-between mb-10">
        {/* Левая часть: логотип и название */}
        <div className="flex items-center gap-5 bg-white rounded-3xl px-6 py-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl">
            <img
              src={logo}
              className="h-13 w-auto object-contain"
              alt="Лаборатория разметки"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Лаборатория разметки</h1>
            <p className="text-2xs text-gray-500 ">Платформа для работы с данными</p>
          </div>
        </div>

        {/* Правая часть: индикаторы и пользователь */}
        <div className="flex items-center gap-6 bg-white rounded-3xl px-6 py-4 shadow-sm border border-gray-100">
          {/* Индикаторы состояния контейнеров */}
          <div className="flex items-center gap-6 pr-6 border-r border-gray-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm transition-all ${
                  messageBackend !== "Backend контейнер не работает"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">Backend</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm transition-all ${
                  messageML !== "ML контейнер не работает"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">ML</span>
            </div>
          </div>

          {/* Профиль пользователя */}
          <div className="flex items-center gap-3">
            {username ? (
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-semibold text-zinc-800 whitespace-nowrap pointer-events-none">
                  {username}
                </div>

                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-11 h-11 rounded-2xl bg-linear-to-br
                  from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center 
                  shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  {username[0].toUpperCase()}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{username}</p>
                      {created_at && (
                        <p className="text-xs text-gray-800 mt-1">
                          Зарегистрирован с{' '}
                          {new Date(created_at).toLocaleDateString('ru-RU', {
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      Выйти из аккаунта
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3 rounded-2xl
                bg-white hover:bg-gray-50 border
                border-gray-200 shadow-sm hover:shadow 
                transition-all duration-200 font-medium
                text-gray-700 active:scale-95"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* левая карточка + центр + правая карточка */}
      <div className="flex-1 flex items-start justify-center gap-8 pt-8">
        
        {/* Левая карточка — Наши плюсы */}
        <InfoCard
          icon="rocket_launch"
          iconBgClass="bg-emerald-100"
          iconTextClass="text-emerald-600"
          title="Наши плюсы"
          description="Современные инструменты разметки, высокая точность и удобный интерфейс для каждого пользователя."
        />

        {/* Центральная */}
        <CenterButton
          icon="auto_awesome"
          title="Создать новый проект"
          description="Начните работать с данными уже сегодня!"
          ctaText="Перейти к проектам"
          onClick={() => navigate("/projects")}
        />

        {/* Правая карточка */}
        <InfoCard
          icon="bolt"
          iconBgClass="bg-blue-100"
          iconTextClass="text-blue-600"
          title="Мы предлагаем"
          description="Удобную платформу для разметки и работы с данными."
        />
      </div>

      {/* Нижняя надпись */}
      <div className="text-center mt-12">
        <p className="text-xs text-gray-400">
          Лаборатория разметки © 2026
        </p>
      </div>
    </div>
  );
}
