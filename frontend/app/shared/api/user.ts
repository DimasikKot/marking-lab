import api from "@/shared/api/axios";
import axios from "axios";

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    access_token: string;
    token_type: string;
    // если в будущем добавят id или другие поля — добавишь
}

export const registerUser = async (data: LoginData): Promise<AuthResponse | undefined> => {
    try {
        const response = await api.post<AuthResponse>("/users/", data);
        localStorage.setItem("access_token", response.data.access_token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при регистрации:", error.response?.data || error.message);
            throw error.response?.data || new Error("Ошибка регистрации");
        }
    }
};

export const loginUser = async (data: LoginData): Promise<AuthResponse | undefined> => {
    try {
        const params = {
            email: data.email.trim(),
            password: data.password,
        };

        // Правильный путь и метод по бэкенду
        const response = await api.get<AuthResponse>("/users/login", { params });

        const token = response.data.access_token;

        if (!token) {
            throw new Error("access_token не найден в ответе сервера");
        }

        localStorage.setItem("access_token", token);
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при входе:", error.response?.data || error.message);
            // Пробрасываем дальше, чтобы компонент мог показать сообщение
            throw error.response?.data || new Error("Ошибка входа");
        }
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при выходе:", error.message);
        }
    }
};
