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

export interface PostProjectRequest {
  name: string;
  description: string;
  is_public: boolean;
}

export interface DeleteProjectResponce {
  detail: string;
  success: boolean;
}

export const fetchProjects = async (
  handleResponse: (data: Project[]) => void,
  setLoading?: (_: boolean) => void,
  setError?: (_: string) => void,
) => {
  try {
    setLoading?.(true);
    const response = await api.get<GetProjectsResponse>("/projects");
    handleResponse(response.data.data);
    setLoading?.(false);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text = "Ошибка при получении проектов: " + error.message;
      toast.error(error_text);
      setError?.(error_text);
    }
  }
};

export const fetchProjectById = async (
  id: string | number,
  handleResponse: (data: Project) => void,
  setLoading?: (_: boolean) => void,
  setError?: (_: string) => void,
) => {
  try {
    setLoading?.(true);
    const response = await api.get<Project>(`/projects/${id}`);
    handleResponse(response.data);
    setLoading?.(false);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text = "Ошибка при получении проекта: " + error.message;
      toast.error(error_text);
      setError?.(error_text);
    }
  }
};

export const createProject = async (
  data: PostProjectRequest,
  handleResponse: (data: Project) => void,
  setLoading?: (_: boolean) => void,
  setError?: (_: string) => void,
) => {
  try {
    setLoading?.(true);
    const response = await api.post<Project>("/projects", data);
    handleResponse(response.data);
    setLoading?.(false);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text = "Ошибка при создании проекта: " + error.message;
      toast.error(error_text);
      setError?.(error_text);
    }
  }
};

export const patchProjectById = async (
  id: string | number,
  data: PostProjectRequest,
  handleResponse: (data: Project) => void,
  setLoading?: (_: boolean) => void,
  setError?: (_: string) => void,
) => {
  try {
    setLoading?.(true);
    const response = await api.patch<Project>(`/projects/${id}`, data);
    handleResponse(response.data);
    setLoading?.(false);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text = "Ошибка при обновлении проекта: " + error.message;
      toast.error(error_text);
      setError?.(error_text);
    }
  }
};

export const deleteProjectById = async (
  id: string | number,
  handleResponse: (data: boolean) => void,
  setLoading?: (_: boolean) => void,
  setError?: (_: string) => void,
) => {
  try {
    setLoading?.(true);
    const response = await api.delete<DeleteProjectResponce>(`/projects/${id}`);
    handleResponse(response.data.success);
    setLoading?.(false);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text = "Ошибка при удалении проекта: " + error.message;
      toast.error(error_text);
      setError?.(error_text);
    }
  }
};
