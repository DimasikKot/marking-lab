import api, { errorValidate } from "@/shared/api/axios";
import type { GetEchoResponse } from "./echo";
import type { FileDbResponse } from "./file";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ModelListResponse {
  id: number;
  name: string;
  progress: number;
  parameters: Record<string, JsonValue>;
  metrics: Record<string, JsonValue>;

  training_files: FileDbResponse[];
  prediction_files: FileDbResponse[];
  predicted_files: FileDbResponse[];

  created_at: string;
  updated_at: string;
}

export interface ModelFullResponse extends ModelListResponse {
  graphs: Record<string, string>;
}

export interface PostModelRequest {
  name: string;
  parameters?: Record<string, JsonValue>;
  training_files_ids?: number[];
  prediction_files_ids?: number[];
}

export const createModel = async (
  projectId: string | number,
  data: PostModelRequest,
): Promise<ModelListResponse | undefined> => {
  try {
    const response = await api.post<ModelListResponse>(
      `/projects/${projectId}/models`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export interface GetModelsResponse {
  data: ModelListResponse[];
}

export const fetchModels = async (
  projectId: string | number,
  sort?: string,
  search?: string,
): Promise<GetModelsResponse | undefined> => {
  try {
    const response = await api.get<GetModelsResponse>(
      `/projects/${projectId}/models`,
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

export const fetchModelById = async (
  projectId: string | number,
  modelId: string | number,
): Promise<ModelFullResponse | undefined> => {
  try {
    const response = await api.get<ModelFullResponse>(
      `/projects/${projectId}/models/${modelId}`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export interface PatchModelFullRequest {
  name?: string;
  parameters?: Record<string, JsonValue>;
  training_files_ids?: number[];
  prediction_files_ids?: number[];
}

export const updateModelById = async (
  projectId: string | number,
  modelId: string | number,
  data: PatchModelFullRequest,
): Promise<ModelFullResponse | undefined> => {
  try {
    const response = await api.patch<ModelFullResponse>(
      `/projects/${projectId}/models/${modelId}`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export const trainModelById = async (
  projectId: string | number,
  modelId: string | number,
): Promise<ModelFullResponse | undefined> => {
  try {
    const response = await api.get<ModelFullResponse>(
      `/projects/${projectId}/models/${modelId}/train`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export const stopTrainModelById = async (
  projectId: string | number,
  modelId: string | number,
): Promise<ModelFullResponse | undefined> => {
  try {
    const response = await api.delete<ModelFullResponse>(
      `/projects/${projectId}/models/${modelId}/train`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export const deleteModelById = async (
  projectId: string | number,
  modelId: string | number,
): Promise<GetEchoResponse | undefined> => {
  try {
    const response = await api.delete<GetEchoResponse>(
      `/projects/${projectId}/models/${modelId}`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};
