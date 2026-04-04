import React from "react";

export const TextField = ({
  className = "",
  placeholder = "",
  disabled = false,
  type = "text",
  value,
  setValue,
}: {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password";
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <input
    type={type}
    className={`
      w-full px-4 py-3 rounded-lg 
      bg-gray-100 
      border border-gray-600 
      focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 
      transition-all duration-200 
      ${className}
    `}
    value={value}
    onChange={(e) => setValue(e.target.value.trim())}
    placeholder={placeholder}
    disabled={disabled}
  />
);
