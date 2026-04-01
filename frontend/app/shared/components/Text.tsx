export const Text = ({
  size = "medium",
  font = "regular",
  className = "",
  children,
}: {
  size?: "small" | "medium" | "large";
  font?: "regular" | "medium";
  colorClass?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <p
    className={`${
      size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg"
    } ${font === "regular" ? "font-normal" : "font-medium"} 
      text-gray-900 ${className}`}
  >
    {children}
  </p>
);