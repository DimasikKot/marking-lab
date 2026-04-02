import React from "react";
import logo from "@/assets/logo/logo.svg";

import { Text } from "@/shared/components/Text";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";


export function LoginRegisterCard({
  title,
  subtitle,
  children,
  buttonText,
  onButtonClick,
  isLoading = false,
  hasAccountLink,
  backButton
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  isLoading?: boolean;
  error?: string | null;
  hasAccountLink?: {
    text: string;
    onClick: () => void;
  };
  backButton?: {
    text?: string;
    onClick: () => void;
  };}) {
  return (
    <div className="w-full max-w-200 mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-300">
        {/* Логотип в левом верхнем углу */}
        <div className="flex justify-start mb-6">
          <img
            src={logo}
            alt="Logo"
            className="w-12 h-12"
          />
        </div>

        <div className="flex gap-12">
          <div className="flex-1">
            <Text size="xl" className="text-left mb-2">
              {title}
            </Text>
            {subtitle && (
              <Text
                size="medium"
                font="regular"
                className="text-left"
              >
                {subtitle}
              </Text>
            )}
          </div>

          
          <div className="flex-1">
            <div className="space-y-5">{children}</div>

            {hasAccountLink && (
              <div className="flex justify-end mt-4">
                <SecondaryButton
                  onClick={hasAccountLink.onClick}
                  size="medium"
                  className="text-sm"
                >
                  {hasAccountLink.text}
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>


        {/* Блок кнопок внизу (Назад слева + Основная кнопка справа) */}
        <div className="flex items-center justify-between mt-8">
          {/* Кнопка Назад (если передана) */}
          {backButton && (
            <SecondaryButton
              onClick={backButton.onClick}
              size="medium"
              className="px-6 py-3"
            >
              {backButton.text || "Назад"}
            </SecondaryButton>
          )}

          {/* Основная кнопка справа */}
          <PrimaryButton
            onClick={onButtonClick}
            disabled={isLoading}
            size="medium"
            className="px-8 py-3"
          >
            {isLoading ? "Загрузка..." : buttonText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}