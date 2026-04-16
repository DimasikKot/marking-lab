import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { fetchFiles, uploadFile, type FileInList } from "@/shared/api/file";

import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextUI } from "@/shared/components/TextUI";
import { FileCard } from "@/shared/components/FileCard";
import { TextField } from "@/shared/components/TextField";

export function Files() {
  const { projectId = 0 } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileInList[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

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

  // Загрузка файла на сервер
  const handleUpload = async () => {
    if (!selectedFile || !projectId) return;

    setUploading(true);

    const result = await uploadFile(selectedFile, selectedFile.name, projectId);

    if (result) {
      setSelectedFile(null);
      loadFiles();
    }

    setUploading(false);
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto m-6">
      <div className="mb-8">
        <TextUI variant="title" className="mb-6">
          Загрузка файла
        </TextUI>

        <div className="flex flex-col gap-4">
          <TextUI variant="label">Выберите файл (TXT, CSV, JSON, MD)</TextUI>

          <input
            type="file"
            accept=".txt,.csv,.json,.md"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 
                file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100 transition-colors"
          />

          {selectedFile && (
            <TextUI variant="desc">
              Выбран файл: <strong>{selectedFile.name}</strong>(
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </TextUI>
          )}

          <ButtonUI
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="mt-2"
          >
            {uploading ? "Загружаем файл..." : "Загрузить на сервер"}
          </ButtonUI>
        </div>
      </div>

      {/* Список файлов */}
      <div className="mb-6 flex justify-between items-center">
        <TextUI variant="header">Файлы проекта</TextUI>

        <div className="max-w-xs w-full">
          <TextField
            value={search}
            setValue={setSearch}
            placeholder="Поиск по имени файла..."
          />
        </div>
      </div>

      {loading && (
        <TextUI variant="desc" className="mb-4">
          Загрузка файлов...
        </TextUI>
      )}

      {!loading && filteredFiles.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <TextUI variant="desc">
            {search
              ? "Файлы по запросу не найдены"
              : "В проекте пока нет файлов"}
          </TextUI>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFiles.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onClick={() => navigate(`/projects/${projectId}/files/${file.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
