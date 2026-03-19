// src/shared/api/upload.ts (или добавьте в существующий файл с функциями)

import api from "./axios";
import axios from "axios";

export interface UploadResponse {
  content: any; // может быть строкой или объектом в зависимости от типа файла
  filename?: string;
  // другие поля, которые возвращает сервер
}

export const uploadFile = async (file: File): Promise<UploadResponse | undefined> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<UploadResponse>("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при загрузке файла:", error.message);
      // Можно дополнительно обработать статус, если нужно
    }
    return undefined;
  }
};