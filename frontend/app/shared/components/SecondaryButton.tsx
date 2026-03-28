import toast from "react-hot-toast";

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
