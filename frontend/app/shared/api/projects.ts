import api from "./axios";
import axios from "axios";

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
}

export const fetchProjects = async (): Promise<
  GetProjectsResponse | undefined
> => {
  try {
    const response = await api.get<GetProjectsResponse>("/projects");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при запросе:", error.message);
    }
  }
};

export const fetchProjectById = async (
  id: string | number,
): Promise<Project | undefined> => {
  try {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при запросе:", error.message);
    }
  }
};

export const createProject = async (
  data: PostProjectRequest,
): Promise<Project | undefined> => {
  try {
    const response = await api.post<Project>("/projects", data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при запросе:", error.message);
    }
  }
};

export const patchProjectById = async (
  id: string | number,
  data: PostProjectRequest,
): Promise<Project | undefined> => {
  try {
    const response = await api.patch<Project>(`/projects/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при запросе:", error.message);
    }
  }
};

export const deleteProjectById = async (
  id: string | number,
): Promise<DeleteProjectResponce | undefined> => {
  try {
    const response = await api.delete<DeleteProjectResponce>(`/projects/${id}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Ошибка при запросе:", error.message);
    }
  }
};
