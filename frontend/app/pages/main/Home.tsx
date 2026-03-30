import { useNavigate } from "react-router-dom";
import { Header } from "@/shared/components/Header";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col overflow-auto">
      <Header>
        <h1 className="text-2xl font-bold">Главная</h1>
      </Header>

      <div className="flex justify-center p-4">
        <PrimaryButton onClick={() => navigate("/projects")}>
          Страница проектов
        </PrimaryButton>
      </div>
    </div>
  );
}
