import axios from "axios";
import toast from "react-hot-toast";

import api from "@/shared/api/axios";

interface GetBackendResponse {
  detail: string;
  status: boolean;
}

// export const fetchBackendEcho = async (
//   setStatus: (status: boolean) => void,
// ) => {
//   try {
//     const response = await api.get<GetBackendResponse>("/echos/backendd");
//     setStatus(response.data.status);
//   } catch {
//     toast.error("Ошибка при запросе backend");
//   }
// };

export const fetchBackendEcho = async (): Promise<
  GetBackendResponse | undefined
> => {
  try {
    const response = await api.get<GetBackendResponse>("/echos/backend");
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

export const fetchMLEcho = async (): Promise<
  GetBackendResponse | undefined
> => {
  try {
    const response = await api.get<GetBackendResponse>("/echos/ml");
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
