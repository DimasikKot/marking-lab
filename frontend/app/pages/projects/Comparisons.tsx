import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { ComparisonFiles } from "../comparisons/ComparisonFiles";
import { ComparisonModels } from "../comparisons/ComparisonModels";

type CompareType = "files" | "models";

export function Comparisons({ projectId }: { projectId: string | number }) {
  const navigate = useNavigate();
  const [type, setType] = useState<CompareType>("files");

  return (
    <div className="max-w-400 mx-auto m-2 mb-80 px-4">
      <div className="flex justify-between items-center mb-6">
        <ButtonPage onClick={() => navigate("/projects")} />
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(["files", "models"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-8 py-2 rounded-xl transition-all font-medium ${
                type === t
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {t === "files" ? "Файлы" : "Модели"}
            </button>
          ))}
        </div>
      </div>

      <ComparisonFiles projectId={projectId} />

      <ComparisonModels projectId={projectId} />
    </div>
  );
}
