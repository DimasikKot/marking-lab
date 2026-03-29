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
      toast.error("Ошибка при запросе backend: " + error.message);
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
      toast.error("Ошибка при запросе ml: " + error.message);
    }
  }
};
