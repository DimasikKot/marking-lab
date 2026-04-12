import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

export interface Word {
  token: string;
  label: string;
}

export interface Line {
  words: Word[];
}

export interface FileDetail {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  page: number;
  total_pages: number;
  total_rows: number;
  rows: Line[];
}

export interface FileInList {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GetFilesResponse {
  data: FileInList[];
}

// ====================== Загрузка файла ======================
export const uploadFile = async (
  file: File,
  name: string | undefined = "Мой файл",
  projectId: string | number,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);

  try {
    const response = await api.post(`/projects/${projectId}/files/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Файл успешно загружен");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      toast.error(error.response?.data?.detail || "Ошибка при загрузке файла");
    }
  }
};

// ====================== Список файлов ======================
export const fetchFiles = async (
  projectId: string | number
): Promise<GetFilesResponse | undefined> => {
  try {
    const response = await api.get<GetFilesResponse>(`/projects/${projectId}/files`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      toast.error(error.response?.data?.detail || "Ошибка при получении списка файлов");
    }
    return undefined;
  }
};

// ====================== Просмотр одного файла ======================
export const fetchFileById = async (
  projectId: string | number,
  fileId: string | number,
  page: number = 1,
  rows: number = 100
): Promise<FileDetail | undefined> => {
  try {
    const response = await api.get<FileDetail>(
      `/projects/${projectId}/files/${fileId}?page=${page}&rows=${rows}`
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      toast.error(error.response?.data?.detail || "Ошибка при загрузке файла");
    }
    return undefined;
  }
};