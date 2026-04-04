import React, { useState } from "react";

import { uploadFile, type PostUploadResponse } from "@/shared/api/file";
import { Button } from "@/shared/components/Button";
import { Header } from "@/shared/components/Header";
import { Text } from "@/shared/components/Text";

export function Files() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [responseData, setResponseData] = useState<PostUploadResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setError(null);
      setResponseData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setUploading(true);
    setError(null);

    const data = await uploadFile(file);

    if (data) {
      setResponseData(data);
    } else {
      setError("Не удалось загрузить файл. Проверьте консоль для деталей.");
    }

    setUploading(false);
  };

  // Функция для отображения содержимого в зависимости от типа файла
  const renderContent = () => {
    if (!responseData) return null;

    // Предполагаем, что сервер возвращает объект с полем 'content'
    const content = responseData.content || responseData;

    if (file?.type === "application/json" || file?.name.endsWith(".json")) {
      return (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    } else if (file?.type === "text/csv" || file?.name.endsWith(".csv")) {
      return (
        <div className="bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap font-mono">
          {typeof content === "string" ? content : JSON.stringify(content)}
        </div>
      );
    } else if (file?.name.endsWith(".md")) {
      // Для Markdown можно добавить библиотеку react-markdown, но пока просто текст
      return (
        <div className="bg-gray-100 p-4 rounded prose max-w-none">
          {typeof content === "string" ? content : JSON.stringify(content)}
        </div>
      );
    } else {
      // TXT и другие текстовые форматы
      return (
        <pre className="bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap">
          {typeof content === "string"
            ? content
            : JSON.stringify(content, null, 2)}
        </pre>
      );
    }
  };

  return (
    <div>
      <Header>Файлы</Header>

      <div className="flex max-w-4xl mx-auto flex-col gap-4">
        <Text variant="title">Страница разметки и загрузки файлов</Text>

        <div className="flex flex-col gap-2">
          <Text variant="label">Выберите файл (JSON, TXT, CSV, MD)</Text>

          <input
            type="file"
            accept=".json,.txt,.csv,.md,application/json,text/plain,text/csv,text/markdown"
            onChange={handleFileChange}
            className="block w-auto text-sm text-gray-500 
          file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
          file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {file && (
            <Text variant="desc">
              Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Text>
          )}
        </div>

        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Загрузка..." : "Загрузить на сервер"}
        </Button>

        {error && (
          <Text variant="error">
            {error}
          </Text>
        )}

        {responseData && (
          <div>
            <Text variant="title">Содержимое файла:</Text>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}
