import api from "@/shared/api/axios";
import axios from "axios";


interface GetBackendResponse {
    detail: string;
    status: string;
}

export const fetchBackendEcho = async (): Promise<GetBackendResponse | undefined> => {
    try {
        const response = await api.get<GetBackendResponse>("/echos/backend");
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при запросе:", error.message);
        }
    }
};


export const fetchMLEcho = async (): Promise<GetBackendResponse | undefined> => {
    try {
        const response = await api.get<GetBackendResponse>("/echos/ml");
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("Ошибка при запросе:", error.message);
        }
    }
};