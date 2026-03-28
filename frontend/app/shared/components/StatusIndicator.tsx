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
