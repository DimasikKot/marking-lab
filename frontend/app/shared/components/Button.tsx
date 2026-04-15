import toast from "react-hot-toast";

export const Button = ({
  onClick = () => {
    toast.success("Кнопка без действия");
  },
  variant = "primary",
  className = "",
  disabled = false,
  children,
}: {
  onClick?: () => void;
  variant?: "primary" | "secondary" | "link";
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) =>
  !disabled && (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-min w-max hover:scale-105 active:scale-95 transition duration-200 select-none
      ${
        {
          primary: `bg-blue-600 hover:bg-blue-800 text-white py-2 px-4 rounded-full shadow-lg font-medium`,
          secondary: `text-blue-600 hover:text-blue-800 font-medium`,
          link: "text-blue-600 text-sm font-medium",
        }[variant]
      } ${className}`}
    >
      {children}
    </button>
  );
