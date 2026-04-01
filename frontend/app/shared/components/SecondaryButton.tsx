import toast from "react-hot-toast";

export const SecondaryButton = ({
  onClick = () => {
    toast.error("Кнопка без действия");
  },
  size = "medium",
  font = "medium",
  className = "",
  disabled = false,
  children,
}: {
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  font?: "regular" | "medium";
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`text-blue-600 hover:text-blue-800 hover:scale-105 active:scale-95 transition duration-200 
      h-min w-auto font-medium ${
        size === "small"
          ? "text-sm"
          : size === "medium"
            ? "text-base"
            : "text-lg"
      } ${font === "regular" ? "font-normal" : "font-medium"} ${className}`}
  >
    {children}
  </button>
);
