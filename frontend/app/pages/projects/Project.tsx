import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/shared/components/Button";
import { Header } from "@/shared/components/Header";

export function Project() {
  const navigate = useNavigate();
  const { projectId = "0" } = useParams();

  return (
    <div>
      <Header>Страница проекта</Header>

      <div className="max-w-6xl mx-auto p-6">
        <Button
          onClick={() => {
            navigate(`/projects/${projectId}/files`);
          }}
          variant="primary"
        >
          Перейти в файлы проекта
        </Button>
      </div>
    </div>
  );
}
