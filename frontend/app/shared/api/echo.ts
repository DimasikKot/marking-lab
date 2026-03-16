import api from "@/shared/api/axios";
import axios from "axios";

interface EchoResponse {
    detail: string;
    status: string;
}

export const fetchBackendEcho = async (): Promise<EchoResponse | undefined> => {
    try {
        const response = await api.get<EchoResponse>("/echos/backend");
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при запросе:", error.message);
        }
    }
};

export const fetchMLEcho = async (): Promise<EchoResponse | undefined> => {
    try {
        const response = await api.get<EchoResponse>("/echos/ml");
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при запросе:", error.message);
        }
    }
};