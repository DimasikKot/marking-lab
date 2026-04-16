import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "@/assets/logo/logo.svg";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { logoutUser } from "@/shared/api/user";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import { TextUI } from "@/shared/components/TextUI";

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div
    onClick={onClick}
    className="h-14 hover:bg-gray-400/30 transition duration-200 flex items-center gap-2 cursor-pointer p-1 rounded-xl"
  >
    <img src={logo} alt="React logo" className="select-none" />
    <TextUI variant="logo" className="mb-1">
      Лаборатория разметки
    </TextUI>
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
    onClick={onClick}
    className="w-12 h-12 rounded-full bg-linear-to-br select-none
    from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center
    shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
  >
    {username[0].toUpperCase()}
  </button>
);

export function Header({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
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
    <div
      className={`h-16 w-full flex items-center justify-between p-1 ${className}`}
    >
      <Logo onClick={() => navigate("/")} />

      <TextUI variant="header" className={`${username ? "mr-1" : "ml-6"}`}>
        {children}
      </TextUI>

      <div className="flex gap-4 items-center rounded-3xl">
        {/* Индикаторы состояния контейнеров */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status={backendStatus} />
            <TextUI variant="desc" isSpan>
              Backend
            </TextUI>
          </div>

          <div className="flex items-center gap-2">
            <StatusIndicator status={mlStatus} />
            <TextUI variant="desc" isSpan>
              ML
            </TextUI>
          </div>
        </div>

        {/* Кнопки входа и регистрации */}
        <div className="flex items-center gap-2">
          <ButtonUI onClick={() => navigate("/components")}>
            Компоненты
          </ButtonUI>

          {username ? (
            <div className="relative">
              <UserIcon
                onClick={() => setShowMenu(!showMenu)}
                username={username}
              />

              {showMenu && (
                <div className="absolute right-0 mt-3 px-4 py-3 w-56 flex flex-col items-start gap-2 bg-white rounded-2xl shadow-xl border border-gray-300 z-20 overflow-hidden">
                  <TextUI>{username}</TextUI>

                  <div className="w-full border-b border-gray-300" />

                  <ButtonUI
                    onClick={() => handleLogout()}
                    variant="secondary"
                    className="text-red-600"
                  >
                    Выйти
                  </ButtonUI>
                </div>
              )}
            </div>
          ) : (
            <ButtonUI onClick={() => navigate("/login")}>Войти</ButtonUI>
          )}
        </div>
      </div>
    </div>
  );
}
