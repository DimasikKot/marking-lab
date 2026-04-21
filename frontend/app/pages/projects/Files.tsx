import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  deleteFileById,
  fetchFiles,
  updateFileById,
  uploadFile,
  type FileInList,
} from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";
import { FileCard } from "@/shared/components/FileCard";
import { TextField } from "@/shared/components/TextField";
import { ButtonPage } from "@/shared/components/ButtonPage";
import type { PatchFileRequest } from "@/shared/api/file";

export function Files() {
  const { projectId = "0" } = useParams<{ projectId: string }>();

  const navigate = useNavigate();
  const [files, setFiles] = useState<FileInList[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingFile, setEditingFile] = useState<FileInList | null>(null);
  const [formData, setFormData] = useState<PatchFileRequest>({
    name: "",
  });

  const loadFiles = async () => {
    setLoading(true);
    const response = await fetchFiles(projectId);
    setLoading(false);
    if (response === undefined) return;
    setFiles(response.data);
  };

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      const response = await fetchFiles(projectId);
      setLoading(false);
      if (response === undefined) return;
      setFiles(response.data);
    };

    loadFiles();
  }, [projectId]);

  // Загрузка нового файла на сервер
  const handleUpload = async () => {
    if (!selectedFile || !projectId) return;

    setUploading(true);
    const result = await uploadFile(selectedFile, selectedFile.name, projectId);
    setUploading(false);

    if (result === undefined) return;
    setSelectedFile(null);
    loadFiles();
  };

  // Открытие формы редактирования
  const handleEditClick = (file: FileInList) => {
    setEditingFile(file);
    setFormData({ name: file.name });
    setIsFormOpen(true);
  };

  // Отправка формы редактирования файла
  const handleSubmitClick = async () => {
    if (!editingFile || !projectId) return;

    setLoading(true);
    const response = await updateFileById(projectId, editingFile.id, formData);
    setLoading(false);

    if (response === undefined) return;

    setIsFormOpen(false);
    setEditingFile(null);
    loadFiles();
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto m-2">
      <ButtonPage
        onClick={() => navigate("/projects")}
        isLoading={loading || uploading}
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

          <ButtonUI
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Отправляем файл..." : "Загрузить на сервер"}
          </ButtonUI>
        </div>
      </div>

      {/* Список файлов */}
      <div className="border border-gray-200 rounded-4xl p-6">
        <div className="mb-4 flex justify-between items-center">
          <TextUI variant="header">Файлы проекта</TextUI>

          <div className="max-w-xs w-full">
            <TextField
              value={search}
              setValue={setSearch}
              placeholder="Поиск по имени файла..."
            />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onClick={() =>
                navigate(`/projects/${projectId}/files/${file.id}/1`)
              }
              onEditClick={() => handleEditClick(file)}
              onDeleteClick={() =>
                deleteFileById(projectId, file.id).then(() => loadFiles())
              }
            />
          ))}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          <div className="flex flex-col gap-4 bg-white rounded-3xl shadow-xl w-xl p-6 z-10">
            <TextUI variant="title">Редактировать файл</TextUI>

            <div className="flex flex-col gap-4">
              <div>
                <TextUI variant="label">Название файла</TextUI>
                <TextField
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  onEnter={handleSubmitClick}
                  onEscape={() => {
                    setIsFormOpen(false);
                    setEditingFile(null);
                  }}
                  autoFocus
                  name="name"
                  placeholder="Новое имя файла..."
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <ButtonUI
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingFile(null);
                  }}
                  variant="secondary"
                >
                  Отмена
                </ButtonUI>

                <ButtonUI onClick={handleSubmitClick}>
                  Сохранить изменения
                </ButtonUI>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
