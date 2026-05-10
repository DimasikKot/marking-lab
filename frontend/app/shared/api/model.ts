import api, { errorValidate } from "@/shared/api/axios";
import type { GetEchoResponse } from "./echo";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ModelDbResponse {
  id: number;
  name: string;
  progress: number;
  parameters: Record<string, JsonValue>;
  metrics: Record<string, JsonValue>;
  graphs: Record<string, string>;

  training_files_ids: number[];
  prediction_files_ids: number[];

  created_at: string;
  updated_at: string;
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
): Promise<ModelDbResponse | undefined> => {
  try {
    const response = await api.post<ModelDbResponse>(
      `/projects/${projectId}/models`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export interface GetModelsResponse {
  data: ModelDbResponse[];
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
): Promise<ModelDbResponse | undefined> => {
  try {
    const response = await api.get<ModelDbResponse>(
      `/projects/${projectId}/models/${modelId}`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};

export interface PatchModelDbRequest {
  name?: string;
  parameters?: Record<string, JsonValue>;
  training_files_ids?: number[];
  prediction_files_ids?: number[];
}

export const updateModelById = async (
  projectId: string | number,
  modelId: string | number,
  data: PatchModelDbRequest,
): Promise<ModelDbResponse | undefined> => {
  try {
    const response = await api.patch<ModelDbResponse>(
      `/projects/${projectId}/models/${modelId}`,
      data,
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

export const trainModelById = async (
  projectId: string | number,
  modelId: string | number,
): Promise<ModelDbResponse | undefined> => {
  try {
    const response = await api.get<ModelDbResponse>(
      `/projects/${projectId}/models/${modelId}/train`,
    );
    return response.data;
  } catch (error: unknown) {
    errorValidate(error);
  }
};
