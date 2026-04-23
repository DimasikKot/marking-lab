import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

interface PostRequest {
  username: string;
  email: string;
  password: string;
}

interface PostResponse {
  username: string;
  access_token: string;
  token_type: string;
}

export const registerUser = async (
  data: PostRequest,
): Promise<PostResponse | undefined> => {
  try {
    const response = await api.post<PostResponse>("/users/", data);
    localStorage.setItem("username", response.data.username);
    localStorage.setItem("access_token", response.data.access_token);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при регистрации: " + error.message;
      toast.error(error_text);
    }
  }
};

interface PostLoginRequest {
  login: string;
  password: string;
}

export const loginUser = async (
  data: PostLoginRequest,
): Promise<PostResponse | undefined> => {
  try {
    const response = await api.post<PostResponse>("/users/login", data);
    localStorage.setItem("username", response.data.username);
    localStorage.setItem("access_token", response.data.access_token);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail || "Ошибка при входе: " + error.message;
      toast.error(error_text);
    }
  }
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    window.location.href = "/";
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail || "Ошибка при выходе: " + error.message;
      toast.error(error_text);
    }
  }
};

interface ValidateUsernameRequest {
  username: string;
}

interface ValidateResponse {
  success: boolean;
}

export const validateUsername = async (
  data: ValidateUsernameRequest,
): Promise<ValidateResponse | undefined> => {
  try {
    const response = await api.post<ValidateResponse>(
      "/users/validate-username",
      data,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при проверке имени пользователя: " + error.message;
      toast.error(error_text);
    }
  }
};

interface ValidateEmailRequest {
  email: string;
}

export const validateEmail = async (
  data: ValidateEmailRequest,
): Promise<ValidateResponse | undefined> => {
  try {
    const response = await api.post<ValidateResponse>(
      "/users/validate-email",
      data,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при проверке электронной почты: " + error.message;
      toast.error(error_text);
    }
  }
};

interface ValidateLoginRequest {
  login: string;
}

export const validateLogin = async (
  data: ValidateLoginRequest,
): Promise<ValidateResponse | undefined> => {
  try {
    const response = await api.post<ValidateResponse>(
      "/users/validate-login",
      data,
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при проверке логина: " + error.message;
      toast.error(error_text);
    }
  }
};
