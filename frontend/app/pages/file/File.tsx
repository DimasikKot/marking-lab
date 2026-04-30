import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { FileEdit } from "./FileEdit";
import { FileLabel } from "./FileLabel";
import { TextUI } from "@/shared/components/TextUI";
import { Header } from "@/shared/components/Header";
import { fetchFileById, type GetFilePageResponse } from "@/shared/api/file";

export function File() {
  const { projectId = "0", fileId = "0" } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const tab = searchParams.get("tab") || "label";

  const [tabIndex, setTabIndex] = useState(tab === "label" ? 1 : 0);

  const [file, setFile] = useState<GetFilePageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const response = await fetchFileById(projectId, fileId, page);
      setLoading(false);
      if (response === undefined) return;
      setFile(response);
    };

    loadPage();
  }, [fileId, page, projectId]);

  // Обработчик смены вкладки
  const handleSelect = (index: number) => {
    setTabIndex(index);
    window.history.replaceState(
      null,
      "",
      `/projects/${projectId}/files/${fileId}?page=${page}&tab=${index === 1 ? "label" : "edit"}`,
    );
  };

  return (
    <Tabs selectedIndex={tabIndex} onSelect={handleSelect}>
      <Header>
        <TabList className="h-full">
          <div className="flex h-full items-end gap-12">
            {/* Текст */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Текст
              </TextUI>
              <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-discrete duration-300 group-[.active]:w-full" />
            </Tab>

            {/* Разметка */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Разметка
              </TextUI>
              <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
            </Tab>
          </div>
        </TabList>
      </Header>

      <TabPanel>
        <FileEdit
          projectId={projectId}
          fileId={fileId}
          page={page}
          file={file}
          loading={loading}
        />
      </TabPanel>

      <TabPanel>
        <FileLabel
          projectId={projectId}
          fileId={fileId}
          page={page}
          file={file}
          loading={loading}
        />
      </TabPanel>
    </Tabs>
  );
}
