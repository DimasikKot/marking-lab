import api, { errorValidate } from "@/shared/api/axios";
import type { GetEchoResponse } from "./echo";

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
  is_labeled: boolean,
): Promise<FileDbResponse | undefined> => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("is_labeled", String(is_labeled));
  formData.append("file", file);

  try {
    const response = await api.post<FileDbResponse>(
      `/projects/${projectId}/files`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
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
    errorValidate(error);
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
  page: string | number,
): Promise<GetFilePageResponse | undefined> => {
  try {
    const response = await api.get<GetFilePageResponse>(
      `/projects/${projectId}/files/${fileId}?page=${page}`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
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
    errorValidate(error);
  }
};

export const deleteFileById = async (
  projectId: string | number,
  fileId: string | number,
): Promise<GetEchoResponse | undefined> => {
  try {
    const response = await api.delete<GetEchoResponse>(
      `/projects/${projectId}/files/${fileId}`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};
