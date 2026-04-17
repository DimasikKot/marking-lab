import { ButtonBack } from "@/shared/components/ButtonBack";
import { useNavigate } from "react-router-dom";

export function Models() {
  // const { projectId = "0", experimentId = "0" } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto m-2">
      <ButtonBack onClick={() => navigate("/projects")} />

      <div className="border border-gray-200 rounded-4xl p-6">
        <p>Страница моделей</p>
      </div>
    </div>
  );
}
