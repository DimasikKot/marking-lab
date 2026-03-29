import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import logo from "@/assets/logo/logo.svg";
import { logoutUser } from "@/shared/api/user";


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
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all hover:-rotate-1 active:rotate-1 h-full">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto">
              <span className="material-icons text-[28px]">
                rocket_launch
              </span>
            </div>
            <h4 className="text-2xl font-semibold text-center mb-4">Наши плюсы</h4>
            <p className="text-gray-600 text-center leading-relaxed">
              Современные инструменты разметки, высокая точность и удобный интерфейс для каждого пользователя.
            </p>
          </div>
        </div>

        {/* Центральная большая кнопка */}
        <div className="w-105 shrink-0 flex items-center justify-center">
          <button
            onClick={() => navigate("/projects")}
            className="group relative flex flex-col 
            items-center justify-center gap-6 px-16 py-14 
            bg-neutral-600 hover:bg-neutral-700 text-white rounded-3xl 
            border border-zinc-700 shadow-2xl hover:shadow-3xl 
            transition-all duration-300 hover:-translate-y-1 active:scale-95"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-icons text-36 text-white">
                auto_awesome
              </span>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-2 tracking-tight">Создать новый проект</h2>
              <p className="text-zinc-400 max-w-xs">
                Начните работать с данными уже сегодня!
              </p>
            </div>

            <div className="mt-4 px-10 py-3.5 bg-white text-zinc-900 rounded-2xl font-medium flex items-center gap-3 
                            group-hover:bg-zinc-100 transition-colors shadow-md">
              Перейти к проектам
              <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        {/* Правая карточка */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all hover:-rotate-1 active:rotate-1 h-full">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto">
              <span className="material-icons text-[28px]">
                bolt
              </span>
            </div>
            <h4 className="text-2xl font-semibold text-center mb-4">Мы предлагаем</h4>
            <p className="text-gray-600 text-center leading-relaxed">
              Удобную платформу для разметки и работы с данными.
            </p>
          </div>
        </div>
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
