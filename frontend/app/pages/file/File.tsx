import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { FileEdit } from "./FileEdit";
import { FileLabel } from "./FileLabel";
import { TextUI } from "@/shared/components/TextUI";
import { Header } from "@/shared/components/Header";
import {
  fetchFileById,
  updateFileByIdContent,
  type GetFilePageResponse,
  type Row,
} from "@/shared/api/file";

export function File() {
  // Переменные URL
  const { projectId = "0", fileId = "0" } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "label";
  const [selectedIndex, setSelectedIndex] = useState(tab === "label" ? 1 : 0);
  const page = searchParams.get("page") || "1";

  // Переменные страниц
  const [file, setFile] = useState<GetFilePageResponse | null>(null);
  const [localRows, setLocalRows] = useState<Row[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const response = await fetchFileById(projectId, fileId, page);
      setLoading(false);

      if (response === undefined) return;
      setFile(response);
      setLocalRows(response.rows);
      hasUnsavedChanges.current = false;
    };

    loadPage();
  }, [fileId, page, projectId]);

  const handleSave = async () => {
    if (!hasUnsavedChanges.current) return;

    setIsSaving(true);
    const response = await updateFileByIdContent(
      projectId,
      fileId,
      { new_rows: localRows },
      page,
    );
    setIsSaving(false);

    if (response === undefined) return;
    toast.success("Изменения текста успешно сохранены!");

    const loadPage = async () => {
      setLoading(true);
      const response = await fetchFileById(projectId, fileId, page);
      setLoading(false);

      if (response === undefined) return;
      setFile(response);
      setLocalRows(response.rows);
      hasUnsavedChanges.current = false;
    };

    loadPage();
  };

  // Обработчик смены вкладки - меняем URL
  const handleSelect = (index: number) => {
    setSelectedIndex(index);

    window.history.replaceState(
      null,
      "",
      `/projects/${projectId}/files/${fileId}?tab=${index === 0 ? "edit" : "label"}&page=${page}`,
    );
  };

  return (
    <Tabs selectedIndex={selectedIndex} onSelect={handleSelect}>
      <Header>
        <TabList className="h-full">
          <div className="flex h-full items-end gap-12">
            {/* Текст */}
            <Tab
              selectedClassName="active"
              className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
            >
              <TextUI variant="normal" className="w-32 text-center">
                Редактор
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
          page={parseInt(page)}
          file={file}
          localRows={localRows}
          setLocalRows={setLocalRows}
          isLoading={isLoading}
          isSaving={isSaving}
          handleSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </TabPanel>

      <TabPanel>
        <FileLabel
          projectId={projectId}
          fileId={fileId}
          page={parseInt(page)}
          file={file}
          localRows={localRows}
          setLocalRows={setLocalRows}
          isLoading={isLoading}
          isSaving={isSaving}
          handleSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </TabPanel>
    </Tabs>
  );
}
