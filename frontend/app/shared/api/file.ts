import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

export interface FileDbResponse {
  id: number;
  name: string;
  total_rows: number;
  is_labeled: boolean;
  created_at: string;
  updated_at: string;
}

export const uploadFile = async (
  projectId: string | number,
  file: File,
  name: string,
  is_labeled: string | boolean,
): Promise<FileDbResponse | undefined> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("is_labeled", is_labeled.toString());

  try {
    const response = await api.post<FileDbResponse>(
      `/projects/${projectId}/files/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    toast.success("Файл успешно загружен");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при загрузке файла: " + error.message;
      toast.error(error_text);
    }
  }
};

export interface GetFilesResponse {
  data: FileDbResponse[];
}

export const fetchFiles = async (
  projectId: string | number,
): Promise<GetFilesResponse | undefined> => {
  try {
    const response = await api.get<GetFilesResponse>(
      `/projects/${projectId}/files`,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при получении списка файлов: " + error.message;
      toast.error(error_text);
    }
  }
};

export interface Word {
  token: string;
  label: string;
}

export interface Row {
  words: Word[];
}

export interface GetFilePageResponse {
  id: number;
  name: string;
  total_rows: number;
  total_pages: number;
  page: number;
  rows: Row[];
  is_labeled: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchFileById = async (
  projectId: string | number,
  fileId: string | number,
  page: string | number = 1,
): Promise<GetFilePageResponse | undefined> => {
  try {
    const response = await api.get<GetFilePageResponse>(
      `/projects/${projectId}/files/${fileId}?page=${page}`,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при выгрузке файла: " + error.message;
      toast.error(error_text);
    }
  }
};

export interface PatchFileDbRequest {
  name: string;
  is_labeled: boolean;
}

export const updateFileById = async (
  projectId: string | number,
  fileId: string | number,
  data: PatchFileDbRequest,
): Promise<FileDbResponse | undefined> => {
  try {
    const response = await api.patch<FileDbResponse>(
      `/projects/${projectId}/files/${fileId}`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при обновлении файла: " + error.message;
      toast.error(error_text);
    }
  }
};

export const deleteFileById = async (
  projectId: string | number,
  fileId: string | number,
): Promise<GetFilePageResponse | undefined> => {
  try {
    const response = await api.delete<GetFilePageResponse>(
      `/projects/${projectId}/files/${fileId}`,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при удалении файла: " + error.message;
      toast.error(error_text);
    }
  }
};
