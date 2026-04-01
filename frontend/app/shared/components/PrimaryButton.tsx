import toast from "react-hot-toast";

export const PrimaryButton = ({
  onClick = () => {
    toast.success("Кнопка без действия");
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
    className={`bg-blue-600 hover:bg-blue-800 hover:scale-105 active:scale-95 transition duration-200 
      h-min w-auto text-white py-2 px-4 rounded-full shadow-lg ${
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
