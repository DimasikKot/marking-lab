import React from 'react';

export const TextField = ({
  size = "medium",
  font = "regular",
  className = "",
  placeholder = "",
  type = "text",
  disabled = false,
  value,
  setValue,
}: {
  size?: "small" | "medium" | "large";
  font?: "regular" | "medium";
  className?: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  disabled?: boolean;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <input
    type={type}
    className={`
      ${size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg"}
      ${font === "regular" ? "font-normal" : "font-medium"}
      ${className}
    `}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
  />
);