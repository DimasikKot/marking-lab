import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import logo from "@/assets/logo/logo.svg";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { logoutUser } from "@/shared/api/user";
import { fetchBackendEcho, fetchMLEcho } from "@/shared/api/echo";
import { TextUI } from "@/shared/components/TextUI";

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div onClick={onClick} className="w-2xl h-14">
    <div className="flex items-center hover:bg-gray-400/30 transition duration-200 gap-2 w-max cursor-pointer p-1 rounded-xl">
      <img src={logo} alt="React logo" className="select-none" />
      <TextUI variant="logo" className="mb-1">
        Лаборатория разметки
      </TextUI>
    </div>
  </div>
);

const UserIcon = ({ username }: { username: string }) => (
  <div
    className="w-12 h-12 rounded-full bg-linear-to-br select-none
    from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center
    shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
  >
    {username[0].toUpperCase()}
  </div>
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
  const username = localStorage.getItem("username");

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

      <TextUI variant="header" className={`w-2xl text-center`}>
        {children}
      </TextUI>

      <div className="flex gap-4 items-center rounded-3xl w-2xl justify-end">
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
            <Menu as="div" className="relative">
              {/* Кнопка */}
              <MenuButton className="outline-none">
                <UserIcon username={username} />
              </MenuButton>

              {/* Меню */}
              <MenuItems
                className="absolute right-0 mt-3 px-4 py-3 w-56 flex flex-col items-start
                          gap-2 bg-white rounded-2xl shadow-xl border border-gray-300 z-20 focus:outline-none"
              >
                <TextUI isSelectable>{username}</TextUI>

                <div className="w-full border-b border-gray-300" />

                <MenuItem>
                  <ButtonUI
                    onClick={logoutUser}
                    variant="secondary"
                    className={`text-red-600 w-full`}
                  >
                    Выйти
                  </ButtonUI>
                </MenuItem>
              </MenuItems>
            </Menu>
          ) : (
            <ButtonUI onClick={() => navigate("/login")}>Войти</ButtonUI>
          )}
        </div>
      </div>
    </div>
  );
}
