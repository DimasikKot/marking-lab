import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { StatusIndicator } from "@/shared/components/StatusIndicator";

export function Components() {
  return (
    <div className="h-full w-full flex flex-col p-8 overflow-auto bg-white text-black items-center">
      <h1 className="text-2xl font-bold">Страница компонентов</h1>
      <p className="text-gray-700">
        Эта страница предназначена для управления компонентами приложения. Здесь
        можно смотреть информацию о компонентах и тестировать их.
      </p>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col items-center gap-2">
          <p>PrimaryButton</p>
          <div className="flex flex-row gap-1">
            <div className="flex flex-col items-center justify-center gap-1">
              <PrimaryButton font="regular" size="small">
                Regular Small
              </PrimaryButton>
              <PrimaryButton font="regular">Regular Stand</PrimaryButton>
              <PrimaryButton font="regular" size="large">
                Regular Large
              </PrimaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <PrimaryButton size="small">Medium Small</PrimaryButton>
              <PrimaryButton>Medium Stand</PrimaryButton>
              <PrimaryButton size="large">Medium Large</PrimaryButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>SecondaryButton</p>
          <div className="flex flex-row gap-1">
            <div className="flex flex-col items-center justify-center gap-1">
              <SecondaryButton font="regular" size="small">
                Regular Small
              </SecondaryButton>
              <SecondaryButton font="regular">Regular Stand</SecondaryButton>
              <SecondaryButton font="regular" size="large">
                Regular Large
              </SecondaryButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <SecondaryButton size="small">Medium Small</SecondaryButton>
              <SecondaryButton>Medium Stand</SecondaryButton>
              <SecondaryButton size="large">Medium Large</SecondaryButton>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>StatusIndicator</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center justify-center gap-1">
              <StatusIndicator status={true} size="small" />
              <StatusIndicator status={false} size="small" />
            </div>

            <div className="flex flex-row items-center justify-center gap-1">
              <StatusIndicator status={true} />
              <StatusIndicator status={false} />
            </div>

            <div className="flex flex-row items-center justify-center gap-1">
              <StatusIndicator status={true} size="large" />
              <StatusIndicator status={false} size="large" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
