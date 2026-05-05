import toast from "react-hot-toast";

export const ButtonUI = ({
  onClick = () => {
    toast.success("Кнопка без действия");
  },
  variant = "primary",
  className = "",
  disabled = false,
  hidden = false,
  children,
}: {
  onClick?: () => void;
  variant?: "primary" | "secondary" | "link";
  className?: string;
  disabled?: boolean;
  hidden?: boolean;
  children: React.ReactNode;
}) =>
  !hidden && (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Останавливаем всплытие
        onClick();
      }}
      disabled={disabled}
      className={`h-min w-max transition duration-200 select-none
      ${
        {
          primary: `${!disabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-600"}
          text-white py-2 px-4 rounded-full shadow-lg font-medium`,
          secondary: `${!disabled ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-gray-600"}
          font-medium`,
          link: `${!disabled ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-gray-600"}
          text-sm font-medium`,
        }[variant]
      } ${!disabled ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </button>
  );
