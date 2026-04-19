import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

export interface Project {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetProjectsResponse {
  data: Project[];
}

export interface PatchProjectRequest {
  name: string;
  description: string;
  is_public: boolean;
}

export interface DeleteProjectResponce {
  detail: string;
  success: boolean;
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

export const fetchProjectById = async (id: string | number) => {
  try {
    const response = await api.get<Project>(`/projects/${id}`);
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

export const createProject = async (data: PatchProjectRequest) => {
  try {
    const response = await api.post<Project>("/projects", data);
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

export const patchProjectById = async (
  id: string | number,
  data: PatchProjectRequest,
) => {
  try {
    const response = await api.patch<Project>(`/projects/${id}`, data);
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

export const deleteProjectById = async (id: string | number) => {
  try {
    const response = await api.delete<DeleteProjectResponce>(`/projects/${id}`);
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
