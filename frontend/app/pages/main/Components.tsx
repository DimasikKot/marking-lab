import type { FileInList } from "@/shared/api/file";
import type { Project } from "@/shared/api/projects";
import { ErrorToast, SuccesToast } from "@/shared/components/CustomToaster";
import { FileCard } from "@/shared/components/FileCard";
import { Header } from "@/shared/components/Header";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { StatusIndicator } from "@/shared/components/StatusIndicator";

export function Components() {
  const project: Project = {
    id: 1,
    name: "NER определитель",
    description: "Самое крутое описание, чтобы не забыть, что за проект",
    is_public: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-20T15:30:00Z",
  };

  const fileInList: FileInList = {
    id: 1,
    name: "Собрание в Москве",
    created_at: "2026-03-26T08:15:00.000Z",
    updated_at: "2026-03-28T09:45:00.000Z",
  };

  return (
    <div className="h-full w-full flex flex-col p-8 overflow-auto bg-white text-black items-center">
      <h1 className="text-2xl font-medium">Страница компонентов</h1>
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

        <div className="flex flex-col items-center gap-2">
          <p>ProjectCard</p>
          <div className="flex flex-row gap-2">
            <ProjectCard project={project} />
            <ProjectCard project={project} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>FileCard</p>
          <div className="flex flex-row gap-2">
            <FileCard file={fileInList} />
            <FileCard file={fileInList} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>Toasts</p>
          <div className="flex flex-row gap-2">
            <SuccesToast />
            <ErrorToast />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p>Header</p>
          <div className="flex flex-row gap-2">
            <Header />
          </div>
        </div>
      </div>
    </div>
  );
}
