import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  deleteFileById,
  fetchFiles,
  updateFileById,
  uploadFile,
  type FileListResponse,
} from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";
import { FileCard } from "@/shared/components/FileCard";
import { TextField } from "@/shared/components/TextField";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { CheckboxUI } from "@/shared/components/CheckboxUI";
import type { PatchFileListRequest } from "@/shared/api/file";

export function Files({
  projectId,
  files,
  setFiles,
  isLoading,
  setIsLoading,
}: {
  projectId: string | number;
  files: FileListResponse[];
  setFiles: (files: FileListResponse[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileIsLabeled, setSelectedFileIsLabeled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Состояния для редактирования
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingFile, setEditingFile] = useState<FileListResponse | null>(null);

  // Состояния для сравнения
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase()),
  );

  const loadFiles = async () => {
    setIsLoading(true);
    const response = await fetchFiles(projectId);
    setIsLoading(false);
    if (response === undefined) return;
    setFiles(response.data);
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < 2) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Загрузка нового файла на сервер
  const handleUpload = async () => {
    if (!selectedFile || !projectId) return;

    setIsUploading(true);
    const response = await uploadFile(
      projectId,
      selectedFile,
      selectedFile.name,
      selectedFileIsLabeled,
    );
    setIsUploading(false);

    if (response === undefined) return;
    toast.success("Файл успешно загружен");
    setSelectedFile(null);
    setSelectedFileIsLabeled(false);
    loadFiles();
  };

  const handleDeleteClick = async (
    file_id: number,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!event || !event.shiftKey) {
      if (!window.confirm("Вы уверены, что хотите удалить этот файл?")) return;
    }

    setIsLoading(true);
    const response = await deleteFileById(projectId, file_id);
    setIsLoading(false);
    if (response === undefined) return;
    toast.success("Файл успешно удалён");
    loadFiles();
  };

  // Открытие формы редактирования
  const handleEditClick = (file: FileListResponse) => {
    setEditingFile(file);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
      <ButtonPage
        onClick={() => navigate("/projects")}
        isLoading={isLoading || isUploading}
      />

      {/* Блок загрузки файла */}
      <div className="mb-8 border border-gray-200 rounded-4xl p-6">
        <TextUI variant="title">Загрузка файла</TextUI>

        <div className="flex flex-col gap-4">
          <TextUI variant="label">Выберите файл (TXT, CSV, JSON, MD)</TextUI>

          <input
            type="file"
            accept=".txt,.csv,.json,.md"
            onChange={(event) => {
              if (event.target.files && event.target.files[0]) {
                setSelectedFile(event.target.files[0]);
              }
            }}
            className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 
                file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 
                hover:file:bg-blue-200 transition-colors"
          />

          {selectedFile && (
            <div className="flex flex-row gap-4">
              <ButtonUI
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Отправляем файл..." : "Загрузить на сервер"}
              </ButtonUI>

              <CheckboxUI
                title="Уже размечен?"
                value={selectedFileIsLabeled}
                onClick={() => setSelectedFileIsLabeled(!selectedFileIsLabeled)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Список файлов */}
      <div className="border border-gray-200 rounded-4xl p-6">
        <div className="mb-4 grid grid-cols-3 items-center gap-4">
          <TextUI variant="header">Файлы проекта</TextUI>

          <TextField
            name="searchFile"
            value={search}
            setValue={setSearch}
            placeholder="Поиск по имени файла..."
          />

          <div className="flex justify-end items-center gap-4">
            {isCompareMode && (
              <ButtonUI
                disabled={selectedIds.length !== 2}
                onClick={() => {
                  navigate(
                    `/projects/${projectId}/files/compare?ids=${selectedIds.join(",")}&page=1`,
                  );
                }}
                className="w-fit whitespace-nowrap"
              >
                Сравнить ({selectedIds.length}/2)
              </ButtonUI>
            )}

            <ButtonUI
              variant={isCompareMode ? "secondary" : "primary"}
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setSelectedIds([]);
              }}
            >
              {isCompareMode ? "Отменить" : "Сравнение"}
            </ButtonUI>
          </div>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <TextUI variant="desc">
              {search
                ? "Файлы по запросу не найдены"
                : "В проекте пока нет файлов"}
            </TextUI>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredFiles.map((file) => {
            const isSelected = selectedIds.includes(file.id);

            return (
              <div key={file.id} className="flex">
                {isCompareMode ? (
                  <div
                    key={file.id}
                    className="flex items-start gap-2 p-2 w-full hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                    onClick={() => toggleSelection(file.id)}
                  >
                    <CheckboxUI value={isSelected} onClick={() => {}} />
                    <FileCard file={file} variant="compact" className="h-fit" />
                  </div>
                ) : (
                  <Link
                    to={`/projects/${projectId}/files/${file.id}?tab=label&page=1`}
                    className="w-full p-2 items-start flex"
                  >
                    <FileCard
                      file={file}
                      onEditClick={() => handleEditClick(file)}
                      onDeleteClick={(event) =>
                        handleDeleteClick(file.id, event)
                      }
                      className="h-full"
                    />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Форма редактирования файла */}
      {isFormOpen && (
        <FileEditForm
          projectId={projectId}
          editingFile={editingFile}
          setIsLoading={setIsLoading}
          onSubmitClickSuccess={() => {
            setIsFormOpen(false);
            setEditingFile(null);
            loadFiles();
          }}
          onEscape={() => {
            setIsFormOpen(false);
            setEditingFile(null);
          }}
        />
      )}
    </div>
  );
}

const FileEditForm = ({
  projectId,
  editingFile,
  setIsLoading,
  onSubmitClickSuccess,
  onEscape,
}: {
  projectId: string | number;
  editingFile: FileListResponse | null;
  setIsLoading: (value: boolean) => void;
  onSubmitClickSuccess?: () => void;
  onEscape?: () => void;
}) => {
  const [formData, setFormData] = useState<PatchFileListRequest>({
    name: editingFile?.name || "",
    is_labeled: editingFile?.is_labeled || false,
  });

  // Отправка формы редактирования файла
  const handleSubmitClick = async () => {
    if (!editingFile || !projectId) return;

    setIsLoading(true);
    const response = await updateFileById(projectId, editingFile.id, formData);
    setIsLoading(false);

    if (response === undefined) return;
    toast.success("Файл успешно изменён");
    onSubmitClickSuccess?.();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div
        onClick={onEscape}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl w-xl p-6 z-10">
        <TextUI variant="title">Редактировать файл</TextUI>

        <div className="flex flex-col gap-4">
          <div>
            <TextUI variant="label">Имя файла</TextUI>

            <TextField
              value={formData.name}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              onEnter={handleSubmitClick}
              onEscape={onEscape}
              autoFocus
              name="name"
              placeholder="Новое имя файла..."
            />
          </div>

          <CheckboxUI
            title="Уже размечен?"
            value={formData.is_labeled}
            onClick={() =>
              setFormData({ ...formData, is_labeled: !formData.is_labeled })
            }
          />

          <div className="flex justify-between items-center">
            <ButtonUI onClick={onEscape} variant="secondary">
              Отмена
            </ButtonUI>

            <ButtonUI onClick={handleSubmitClick}>Сохранить изменения</ButtonUI>
          </div>
        </div>
      </div>
    </div>
  );
};
