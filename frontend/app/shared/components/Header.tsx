import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "@/assets/logo/logo.svg";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { logoutUser } from "@/shared/api/user";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import { Text } from "@/shared/components/Text";

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div
    onClick={onClick}
    className="h-12 hover:scale-102 active:scale-95 transition duration-200 flex items-center gap-2"
  >
    <img src={logo} alt="React logo" />
    <h1 className="text-2xl font-bold mb-1">Лаборатория разметки</h1>
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
    className="w-12 h-12 rounded-full bg-linear-to-br
    from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center 
    shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
  >
    {username[0].toUpperCase()}
  </button>
);

export function Header({ children }: { children?: React.ReactNode }) {
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
    <div className="h-auto w-full flex items-center justify-between p-3">
      <Logo onClick={() => navigate("/")} />

      {/* <div className="h-full p-1 mt-1 items-center justify-center flex flex-row text-2xl font-bold">
        {children}
      </div> */}

      <Text size="xl" className={`mt-1 ${username ? "mr-1" : "ml-6"}`}>
        {children}
      </Text>

      <div className="flex gap-4 items-center rounded-3xl">
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
        <div className="flex items-center gap-2">
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
                <div className="absolute right-0 mt-3 px-4 py-3 w-56 flex flex-col items-start gap-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  <p className="font-medium text-gray-800">{username}</p>

                  <div className="w-full border-b border-gray-100" />

                  <SecondaryButton
                    onClick={() => handleLogout()}
                    className="text-red-600"
                  >
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
