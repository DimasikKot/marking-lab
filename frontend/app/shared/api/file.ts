import api, { errorValidate } from "@/shared/api/axios";
import type { GetEchoResponse } from "./echo";
import type { JsonValue } from "./model";

export interface FileDbResponse {
  id: number;
  name: string;
  total_rows: number;
  is_labeled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionModelDbResponse {
  id: number;
  name: string;
  parameters: Record<string, JsonValue>;

  training_files: FileDbResponse[];

  created_at: string;
  updated_at: string;
}

export interface FileDbListResponse extends FileDbResponse {
  origin_file: FileDbResponse | null;
  prediction_model: PredictionModelDbResponse | null;
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
  data: FileDbListResponse[];
}

export const fetchFiles = async (
  projectId: string | number,
  sort?: string,
  search?: string,
): Promise<GetFilesResponse | undefined> => {
  try {
    const response = await api.get<GetFilesResponse>(
      `/projects/${projectId}/files`,
      {
        params: {
          sort,
          search,
        },
      },
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
  tags: Record<string, string>;
  colors: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export const fetchFileById = async (
  projectId: string | number,
  fileId: string | number,
  page?: string | number,
  count?: string | number,
): Promise<GetFilePageResponse | undefined> => {
  try {
    const response = await api.get<GetFilePageResponse>(
      `/projects/${projectId}/files/${fileId}`,
      {
        params: {
          page,
          count,
        },
      },
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

export interface PatchFileContentRequest {
  new_rows: Row[];
}

export const updateFileByIdContent = async (
  projectId: string | number,
  fileId: string | number,
  data: PatchFileContentRequest,
  page?: string | number,
  rows?: string | number,
): Promise<FileDbResponse | undefined> => {
  try {
    const response = await api.patch<FileDbResponse>(
      `/projects/${projectId}/files/${fileId}/content`,
      data,
      {
        params: {
          page,
          rows,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};
