export const Text = ({
  size = "small",
  font = "medium",
  className = "",
  children,
}: {
  size?: "small" | "medium" | "large" | "xl";
  font?: "regular" | "medium";
  colorClass?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <p
    className={`text-gray-900 ${font === "regular" ? "font-normal" : "font-medium"} ${
      size === "small"
        ? "text-sm"
        : size === "medium"
          ? "text-base"
          : size === "large"
            ? "text-lg"
            : "text-3xl font-bold"
    } ${className}`}
  >
    {children}
  </p>
);
