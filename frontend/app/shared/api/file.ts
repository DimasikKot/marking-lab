import api from "./axios";
import axios from "axios";


export interface PostUploadResponse {
  content: string;
  filename?: string;
}

export const uploadFile = async (file: File): Promise<PostUploadResponse | undefined> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<PostUploadResponse>("/files/upload", formData, {
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