import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/shared/components/Button";

export function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  return (
    <div>
      <p>Страница проекта</p>
      <Button
        onClick={() => {
          navigate(`/projects/${projectId}/files`);
        }}
        variant="primary"
      >
        Перейти в файлы проекта
      </Button>
    </div>
  );
}
