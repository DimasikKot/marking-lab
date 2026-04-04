export const Text = ({
  variant = "normal",
  className = "",
  isSelectable = false,
  isSpan = false,
  children,
}: {
  variant?: "desc" | "label" | "error" | "normal" | "title" | "logo" | "header";
  className?: string;
  isSelectable?: boolean;
  isSpan?: boolean;
  children: React.ReactNode;
}) =>
  isSpan ? (
    <span
      className={`line-clamp-3 leading-relaxed
        ${isSelectable ? "select-text" : "select-none"}
        ${
          {
            desc: "text-gray-600 text-sm font-normal",
            label: "text-gray-700 text-sm font-medium",
            error: "text-red-600 text-sm font-medium",
            normal: "text-black text-base font-medium",
            title: "text-black text-xl font-bold",
            logo: "text-black text-2xl font-bold",
            header: "text-black text-3xl font-bold",
          }[variant]
        }
        ${className}`}
    >
      {children}
    </span>
  ) : (
    <p
      className={`line-clamp-3 leading-relaxed
        ${isSelectable ? "select-text" : "select-none"}
        ${
          {
            desc: "text-gray-600 text-sm font-normal",
            label: "text-gray-700 text-sm font-medium",
            error: "text-red-600 text-sm font-medium",
            normal: "text-black text-base font-medium",
            title: "text-black text-xl font-bold",
            logo: "text-black text-2xl font-bold",
            header: "text-black text-3xl font-bold",
          }[variant]
        }
        ${className}`}
    >
      {children}
    </p>
  );
