import { ButtonPage } from "@/shared/components/ButtonPage";
import { useNavigate } from "react-router-dom";

export function Comparisons({ projectId }: { projectId: string | number }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <ButtonPage onClick={() => navigate("/projects")} />

      <div className="border border-gray-200 rounded-4xl p-6">
        <p>Можно сравнить файлы или модели</p>

        <p>{projectId}</p>
      </div>
    </div>
  );
}
