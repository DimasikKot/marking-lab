import api from "@/shared/api/axios";
import axios from "axios";

interface LoginData {
    email: string;
    password: string; //...
}

interface AuthResponse {
    id: number; //...
    token: string;
}

export const registerUser = async (data: LoginData) => {
    try {
        const response = await api.post<AuthResponse>("/user/", data);
        localStorage.setItem("access_token", response.data.token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при регистрации:", error.response?.data || error.message);
            throw error.response?.data || new Error("Ошибка регистрации");
        }
    }
};

export const loginUser = async (data: LoginData) => {
    try {
        const response = await api.post<AuthResponse>("/login", data);
        localStorage.setItem("access_token", response.data.token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при входе:", error.response?.data || error.message);
            throw error.response?.data || new Error("Ошибка входа");
        }
    }
};

export const logoutUser = () => {
    try {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при выходе:", error.message);
        }
    }
};
