import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

export interface GetEchoResponse {
  detail: string;
  success: boolean;
}

export const fetchBackendEcho = async (): Promise<
  GetEchoResponse | undefined
> => {
  try {
    const response = await api.get<GetEchoResponse>("/echos/backend");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при запросе backend: " + error.message;
      toast.error(error_text);
    }
  }
};

export const fetchMLEcho = async (): Promise<GetEchoResponse | undefined> => {
  try {
    const response = await api.get<GetEchoResponse>("/echos/ml");
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const error_text =
        error.response?.data?.detail ||
        "Ошибка при запросе ml: " + error.message;
      toast.error(error_text);
    }
  }
};
