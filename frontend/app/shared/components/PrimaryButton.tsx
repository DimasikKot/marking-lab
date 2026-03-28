import toast from "react-hot-toast";

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
