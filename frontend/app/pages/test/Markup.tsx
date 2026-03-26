import { uploadFile, type PostUploadResponse } from "@/shared/api/file";
import React, { useState } from "react";

export function Markup() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [responseData, setResponseData] = useState<PostUploadResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Страница разметки и загрузки файлов
      </h1>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Выберите файл (JSON, TXT, CSV, MD)
        </label>
        <input
          type="file"
          accept=".json,.txt,.csv,.md,application/json,text/plain,text/csv,text/markdown"
          onChange={handleFileChange}
          className="block w-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300 hover:bg-blue-700 transition"
      >
        {uploading ? "Загрузка..." : "Загрузить на сервер"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {responseData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Содержимое файла:</h2>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
