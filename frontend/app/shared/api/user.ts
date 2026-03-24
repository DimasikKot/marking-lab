import api from "@/shared/api/axios";
import axios from "axios";


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

export const registerUser = async (data: PostRequest): Promise<PostResponse | undefined> => {
    try {
        const response = await api.post<PostResponse>("/users/", data);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("access_token", response.data.access_token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при регистрации:", error.response?.data || error.message);
            throw error.response?.data || new Error("Ошибка регистрации");
        }
    }
};


interface PostLoginRequest {
    login: string;
    password: string;
}

export const loginUser = async (data: PostLoginRequest): Promise<PostResponse | undefined> => {
    try {
        const response = await api.post<PostResponse>("/users/login", data);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("access_token", response.data.access_token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при входе:", error.response?.data || error.message);
            throw error.response?.data || new Error("Ошибка входа");
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
            console.error("Ошибка при выходе:", error.message);
        }
    }
};
