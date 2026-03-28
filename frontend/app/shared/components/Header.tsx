import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "@/assets/logo/logo.svg";
import { StatusIndicator } from "./StatusIndicator";
import { PrimaryButton } from "./PrimaryButton";
import { logoutUser } from "../api/user";
import { SecondaryButton } from "./SecondaryButton";
import { fetchBackendEcho, fetchMLEcho } from "../api/echo";

const Logo = () => (
  <div className="flex items-center gap-2 p-2">
    <img src={logo} alt="React logo" />
    <h1 className="text-2xl font-bold">Лаборатория разметки</h1>
  </div>
);

const UserIcon = ({
  onClick,
  username,
}: {
  onClick: () => void;
  username: string;
}) => (
  <button
    className="w-12 h-12 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center hover:bg-blue-600 transition"
    onClick={onClick}
  >
    {username[0].toUpperCase()}
  </button>
);

export function Header() {
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState(false);
  const [mlStatus, setMlStatus] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    logoutUser();
    setShowMenu(false);
  };

  useEffect(() => {
    const load = async () => {
      const dataBackend = await fetchBackendEcho();
      if (dataBackend === undefined) return;
      setBackendStatus(dataBackend.status);

      const dataMl = await fetchMLEcho();
      if (dataMl === undefined) return;
      setMlStatus(dataMl.status);
    };

    load();
  }, []); // <- пустой массив = выполнится только один раз при монтировани

  return (
    <div className="h-auto w-full flex flex-row justify-between">
      <Logo />

      <div className="flex items-center gap-4 rounded-3xl p-4">
        {/* Индикаторы состояния контейнеров */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status={backendStatus} />
            <span className="text-sm text-gray-600">Backend</span>
          </div>

          <div className="flex items-center gap-2">
            <StatusIndicator status={mlStatus} />
            <span className="text-sm text-gray-600">ML</span>
          </div>
        </div>

        {/* Кнопки входа и регистрации */}
        <div className="flex gap-2">
          <PrimaryButton onClick={() => navigate("/components")}>
            Компоненты
          </PrimaryButton>

          {username ? (
            <div className="relative">
              <UserIcon
                onClick={() => setShowMenu(!showMenu)}
                username={username}
              />

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                  <SecondaryButton onClick={() => handleLogout()}>
                    Выйти
                  </SecondaryButton>
                </div>
              )}
            </div>
          ) : (
            <PrimaryButton onClick={() => navigate("/login")}>
              Войти
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
