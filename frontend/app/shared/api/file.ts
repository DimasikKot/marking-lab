import api from "./axios";
import axios from "axios";

export interface UploadResponse {
  content: string;
  filename?: string;
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
    }
    return undefined;
  }
};