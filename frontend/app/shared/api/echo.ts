import api from "@/shared/api/axios";
import toast from "react-hot-toast";

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
  } catch {
    toast.error("Ошибка при запросе backend");
  }
};

export const fetchMLEcho = async (): Promise<
  GetBackendResponse | undefined
> => {
  try {
    const response = await api.get<GetBackendResponse>("/echos/ml");
    return response.data;
  } catch {
    toast.error("Ошибка при запросе ml");
  }
};
