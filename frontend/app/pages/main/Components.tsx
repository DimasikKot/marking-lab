import type { FileInList } from "@/shared/api/file";
import type { Project } from "@/shared/api/projects";
import { FileCard } from "@/shared/components/FileCard";
import { Header } from "@/shared/components/Header";
import { Button } from "@/shared/components/Button";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { Text } from "@/shared/components/Text";

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

      <div className="max-w-6xl flex flex-col gap-4 mx-auto p-2">
        <div className="flex flex-col items-center gap-2">
          <Text variant="title">Компонент Text</Text>

          <div className="flex flex-col items-center justify-center gap-1">
            <Text variant="desc">description</Text>
            <Text variant="normal">normal</Text>
            <Text variant="title">title</Text>
            <Text variant="header">header</Text>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Text variant="title">Компонент Button</Text>

          <div className="flex flex-col items-center justify-center gap-1">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Text variant="title">Компонент StatusIndicator</Text>

          <div className="flex flex-row items-center justify-center gap-1">
            <StatusIndicator status={true} />
            <StatusIndicator status={false} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Text variant="title">Компонент ProjectCard</Text>

          <div className="flex flex-row gap-2">
            <ProjectCard project={project} />
            <ProjectCard project={project} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Text variant="title">Компонент FileCard</Text>

          <div className="flex flex-row gap-2">
            <FileCard file={fileInList} />
            <FileCard file={fileInList} />
          </div>
        </div>
      </div>
    </div>
  );
}
