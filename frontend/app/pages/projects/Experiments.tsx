import { ButtonPage } from "@/shared/components/ButtonPage";
import { useNavigate } from "react-router-dom";

export function Experiments() {
  // const { projectId = "0", experimentId = "0" } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto m-2">
      <ButtonPage onClick={() => navigate("/projects")} />

      <div className="border border-gray-200 rounded-4xl p-6">
        <p>Список экспериментов</p>
      </div>
    </div>
  );
}
