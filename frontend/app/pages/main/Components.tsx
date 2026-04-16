import type { FileInList } from "@/shared/api/file";
import type { Project } from "@/shared/api/projects";
import { FileCard } from "@/shared/components/FileCard";
import { Header } from "@/shared/components/Header";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { TextUI } from "@/shared/components/TextUI";

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
    <div>
      <Header>Страница компонентов</Header>

      <div className="max-w-6xl flex flex-col gap-4 mx-auto m-2">
        <div className="flex flex-col items-center gap-2">
          <TextUI variant="title">Компонент Text</TextUI>

          <div className="flex flex-col items-center justify-center gap-1">
            <TextUI variant="desc">description</TextUI>
            <TextUI variant="normal">normal</TextUI>
            <TextUI variant="title">title</TextUI>
            <TextUI variant="header">header</TextUI>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <TextUI variant="title">Компонент Button</TextUI>

          <div className="flex flex-col items-center justify-center gap-1">
            <ButtonUI variant="primary">Primary</ButtonUI>
            <ButtonUI variant="secondary">Secondary</ButtonUI>
            <ButtonUI variant="link">Link</ButtonUI>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <TextUI variant="title">Компонент StatusIndicator</TextUI>

          <div className="flex flex-row items-center justify-center gap-1">
            <StatusIndicator status={true} />
            <StatusIndicator status={false} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <TextUI variant="title">Компонент ProjectCard</TextUI>

          <div className="flex flex-row gap-2">
            <ProjectCard project={project} />
            <ProjectCard project={project} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <TextUI variant="title">Компонент FileCard</TextUI>

          <div className="flex flex-row gap-2">
            <FileCard file={fileInList} />
            <FileCard file={fileInList} />
          </div>
        </div>
      </div>
    </div>
  );
}
