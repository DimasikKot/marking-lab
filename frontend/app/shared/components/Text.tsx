export const Text = ({
  variant = "normal",
  className = "",
  children,
}: {
  variant?: "description" | "normal" | "title" | "header";
  className?: string;
  children: React.ReactNode;
}) => (
  <p
    className={`${
      {
        description: "text-gray-600 text-sm font-normal",
        normal: "text-base font-medium",
        title: "text-xl font-bold",
        header: "text-3xl font-bold",
      }[variant]
    } ${className}`}
  >
    {children}
  </p>
);
