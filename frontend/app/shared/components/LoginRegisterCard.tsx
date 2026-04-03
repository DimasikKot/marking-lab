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
  const isFirstStep = !backButton; 

  return (
    <div className="w-full max-w-200 mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-300">
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
                className="text-gray-600 text-left"
              >
                {subtitle}
              </Text>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-">{children}</div>
            {hasAccountLink && (
              <div className="flex justify-start mt-4">
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

        <div className="mt-8 flex items-center justify-between">
          {backButton && (
            <SecondaryButton
              onClick={backButton.onClick}
              size="medium"
              className="px-6 py-3"
            >
              {backButton.text || "Назад"}
            </SecondaryButton>
          )}

          <div className={isFirstStep ? "ml-auto" : ""}>
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
    </div>
  );
}