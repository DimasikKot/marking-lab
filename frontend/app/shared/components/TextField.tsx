export const TextField = ({
  value,
  setValue,
  onChange,
  placeholder = "",
  disabled = false,
  name = "",
  type = "text",
  className = "",
  isArea = false,
  rows = 1,
}: {
  value: string;
  setValue?: React.Dispatch<React.SetStateAction<string>>;
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  type?: "text" | "email" | "password";
  className?: string;
  isArea?: boolean;
  rows?: number;
}) => {
  return isArea ? (
    <textarea
      name={name}
      value={value}
      onChange={
        onChange || ((event) => setValue && setValue(event.target.value))
      }
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full px-3 py-3 rounded-lg
        bg-white
        border border-gray-300
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300
        transition-colors duration-200
        ${className}
      `}
    />
  ) : (
    <input
      name={name}
      value={value}
      onChange={
        onChange || ((event) => setValue && setValue(event.target.value))
      }
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      className={`
      w-full px-3 py-3 rounded-lg
      bg-white
      border border-gray-300
      focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300
      transition-colors duration-200
      ${className}
    `}
    />
  );
};
