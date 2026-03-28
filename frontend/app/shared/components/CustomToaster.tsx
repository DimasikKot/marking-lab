import { Toaster } from "react-hot-toast";

export const CustomToaster = () => (
  <Toaster
    position="top-center"
    toastOptions={{
      duration: 4000,
      style: {
        background: "#333",
        color: "#fff",
        borderRadius: "10px",
        padding: "12px 16px",
      },
    }}
  />
);

export const SuccesToast = () => (
  <div></div>
)

export const ErrorToast = () => (
  <div></div>
)