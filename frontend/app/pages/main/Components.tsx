import toast from "react-hot-toast";

export function Components() {
  return (
    <div className="h-full w-full flex flex-col p-8 overflow-auto bg-white text-black items-center">
      <h1 className="text-2xl font-bold">Страница компонентов</h1>
      <p className="text-gray-700">
        Эта страница предназначена для управления компонентами приложения. Здесь
        можно смотреть информацию о компонентах и тестировать их.
      </p>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col items-center gap-2">
          <p>PrimaryButton</p>
          <div className="flex flex-row gap-1">
            <div className="flex flex-col items-center justify-center gap-1">
              <PrimaryButton font="regular" size="small">
                Нажми на меня
              </PrimaryButton>
              <PrimaryButton size="small">Нажми на меня</PrimaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <PrimaryButton font="regular">Нажми на меня</PrimaryButton>
              <PrimaryButton>Нажми на меня</PrimaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <PrimaryButton font="regular" size="large">
                Нажми на меня
              </PrimaryButton>
              <PrimaryButton size="large">Нажми на меня</PrimaryButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>SecondaryButton</p>
          <div className="flex flex-row gap-1">
            <div className="flex flex-col items-center justify-center gap-1">
              <SecondaryButton font="regular" size="small">
                Нажми на меня
              </SecondaryButton>
              <SecondaryButton size="small">Нажми на меня</SecondaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <SecondaryButton font="regular">Нажми на меня</SecondaryButton>
              <SecondaryButton>Нажми на меня</SecondaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <SecondaryButton font="regular" size="large">
                Нажми на меня
              </SecondaryButton>
              <SecondaryButton size="large">Нажми на меня</SecondaryButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>StatusIndicator</p>
          <div className="flex flex-row gap-2">
            <StatusIndicator status={true} />
            <StatusIndicator status={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const PrimaryButton = ({
  onClick = () => {
    toast.error("Кнопка без действия");
  },
  size = "medium",
  font = "medium",
  className = "",
  children,
}: {
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  font?: "regular" | "medium";
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`bg-[#165FD2] hover:bg-[#124DB0] text-white py-2 px-4 rounded-full shadow-lg transition duration-300 ${
      size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg"
    } ${font === "regular" ? "font-normal" : "font-medium"} ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton = ({
  onClick = () => {
    toast.error("Кнопка без действия");
  },
  size = "medium",
  font = "medium",
  className = "",
  children,
}: {
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  font?: "regular" | "medium";
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`text-[#165FD2] hover:text-[#124DB0] font-medium py-1 px-2 transition duration-300 ${
      size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg"
    } ${font === "regular" ? "font-normal" : "font-medium"} ${className}`}
  >
    {children}
  </button>
);

export const StatusIndicator = ({
  status,
  size = "medium",
  className = "",
}: {
  status: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}) => (
  <div
    className={`rounded-full ${
      size === "small" ? "h-2 w-2" : size === "large" ? "h-4 w-4" : "h-3 w-3"
    } ${status === true ? "bg-green-500" : "bg-red-500"} ${className}`}
  />
);
