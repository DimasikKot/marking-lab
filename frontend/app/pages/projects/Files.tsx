import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { 
  fetchFiles, 
  uploadFile, 
  type FileInList 
} from "@/shared/api/file";

import { Button } from "@/shared/components/Button";
import { Text } from "@/shared/components/Text";
import { Header } from "@/shared/components/Header";
import { FileCard } from "@/shared/components/FileCard";
import { TextField } from "@/shared/components/TextField";

export function Files() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileInList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  // Загрузка списка файлов
  const loadFiles = useCallback(async () => {
    if (!projectId) {
      setError("ID проекта не найден");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFiles(projectId);
      if (response?.data) {
        setFiles(response.data);
      } else {
        setError("Не удалось загрузить список файлов");
      }
    } catch (err: any) {
      console.error(err);
      setError("Произошла ошибка при загрузке файлов");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header>Файлы проекта</Header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <Text variant="title" className="mb-6">Загрузка файла</Text>

          <div className="flex flex-col gap-4">
            <Text variant="label">Выберите файл (TXT, CSV, JSON, MD)</Text>

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
              <Text variant="desc">
                Выбран файл: <strong>{selectedFile.name}</strong> 
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="mt-2"
            >
              {uploading ? "Загружаем файл..." : "Загрузить на сервер"}
            </Button>
          </div>
        </div>

        {/* Список файлов */}
        <div className="mb-6 flex justify-between items-center">
          <Text variant="header">Файлы проекта</Text>

          <div className="max-w-xs w-full">
            <TextField
              value={search}
              setValue={setSearch}
              placeholder="Поиск по имени файла..."
            />
          </div>
        </div>

        {loading && <Text variant="desc" className="mb-4">Загрузка файлов...</Text>}
        {error && <Text variant="error" className="mb-4">{error}</Text>}

        {!loading && filteredFiles.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Text variant="desc">
              {search ? "Файлы по запросу не найдены" : "В проекте пока нет файлов"}
            </Text>
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
    </div>
  );
}
