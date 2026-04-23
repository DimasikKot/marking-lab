import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";
import type { GetEchoResponse } from "./echo";

export interface ProjectDbResponse {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const createProject = async (
  data: PatchProjectRequest,
): Promise<ProjectDbResponse | undefined> => {
  try {
    const response = await api.post<ProjectDbResponse>("/projects", data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при создании проекта: " + error.message;
      toast.error(error_text);
    }
  }
};

export interface GetProjectsResponse {
  data: ProjectDbResponse[];
}

export const fetchProjects = async (): Promise<
  GetProjectsResponse | undefined
> => {
  try {
    const response = await api.get<GetProjectsResponse>("/projects");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при получении проектов: " + error.message;
      toast.error(error_text);
    }
  }
};

export const fetchProjectById = async (
  projectId: string | number,
): Promise<ProjectDbResponse | undefined> => {
  try {
    const response = await api.get<ProjectDbResponse>(`/projects/${projectId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при получении проекта: " + error.message;
      toast.error(error_text);
    }
  }
};

export interface PatchProjectRequest {
  name: string;
  description: string;
  is_public: boolean;
}

export const patchProjectById = async (
  projectId: string | number,
  data: PatchProjectRequest,
): Promise<ProjectDbResponse | undefined> => {
  try {
    const response = await api.patch<ProjectDbResponse>(
      `/projects/${projectId}`,
      data,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при обновлении проекта: " + error.message;
      toast.error(error_text);
    }
  }
};

export const deleteProjectById = async (
  projectId: string | number,
): Promise<GetEchoResponse | undefined> => {
  try {
    const response = await api.delete<GetEchoResponse>(
      `/projects/${projectId}`,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при удалении проекта: " + error.message;
      toast.error(error_text);
    }
  }
};
