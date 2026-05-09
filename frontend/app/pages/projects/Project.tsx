import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Files } from "./Files";
import { Models } from "./Models";
import { Comparisons } from "./Comparisons";
import { Header } from "@/shared/components/Header";
import { TextUI } from "@/shared/components/TextUI";
import { fetchFiles, type FileDbResponse } from "@/shared/api/file";
import { fetchModels, type ModelDbResponse } from "@/shared/api/model";

export function Project() {
  // Переменные URL
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "files";
  const [selectedIndex, setSelectedIndex] = useState(
    tab === "files" ? 0 : tab === "models" ? 1 : 2,
  );
  // const page = searchParams.get("page") || "1";

  // Переменные страниц
  const [files, setFiles] = useState<FileDbResponse[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const [models, setModels] = useState<ModelDbResponse[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      setLoadingFiles(true);
      const response = await fetchFiles(projectId);
      setLoadingFiles(false);
      if (response === undefined) return;
      setFiles(response.data);
    };

    const loadModels = async () => {
      setLoadingModels(true);
      const response = await fetchModels(projectId);
      setLoadingModels(false);
      if (response === undefined) return;
      setModels(response.data);
    };

    loadFiles();
    loadModels();
  }, [selectedIndex, projectId]);

  // Обработчик смены вкладки - меняем URL
  const handleSelect = (index: number) => {
    setSelectedIndex(index);

    window.history.replaceState(
      null,
      "",
      `/projects/${projectId}?tab=${index === 0 ? "files" : index === 1 ? "models" : "experiments"}`,
    );
  };

  return (
    <Tabs selectedIndex={selectedIndex} onSelect={handleSelect}>
      <Header>
        <TabList className="h-full">
          <div className="flex h-full items-end gap-12">
            {/* Файлы */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Файлы
              </TextUI>
              <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-discrete duration-300 group-[.active]:w-full" />
            </Tab>

            {/* Модели */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Модели
              </TextUI>
              <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
            </Tab>

            {/* Сравнения */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 text-gray-500 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Сравнения
              </TextUI>
              <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
            </Tab>
          </div>
        </TabList>
      </Header>

      <TabPanel>
        <Files
          projectId={projectId}
          files={files}
          setFiles={setFiles}
          loading={loadingFiles}
          setLoading={setLoadingFiles}
        />
      </TabPanel>

      <TabPanel>
        <Models
          projectId={projectId}
          models={models}
          setModels={setModels}
          loading={loadingModels}
          setLoading={setLoadingModels}
        />
      </TabPanel>

      <TabPanel>
        <Comparisons projectId={projectId} />
      </TabPanel>
    </Tabs>
  );
}
