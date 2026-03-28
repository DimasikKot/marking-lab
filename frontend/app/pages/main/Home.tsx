import { useNavigate } from "react-router-dom";
import { Header } from "@/shared/components/Header";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col overflow-auto">
      <Header />

      {/* Блок с основными кнопками навигации */}
      <button
        onClick={() => navigate("/projects")}
        className="p-4 rounded-2xl transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
      >
        Создать проект
      </button>
    </div>
  );
}
