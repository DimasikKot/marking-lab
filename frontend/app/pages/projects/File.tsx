import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  type NavigateFunction,
} from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { Text } from "@/shared/components/Text";
import { Button } from "@/shared/components/Button";
import {
  fetchFileById,
  type FileDetail,
  type Line,
  type Word,
} from "@/shared/api/file";

const PageNavigate = ({
  projectId,
  fileId,
  currentPage: page,
  totalPages: total_pages,
  navigate,
}: {
  projectId: string;
  fileId: string;
  currentPage: string;
  totalPages: number;
  navigate: NavigateFunction;
}) => (
  <div>
    {total_pages > 1 && (
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}/${parseInt(page) - 1}`,
            )
          }
          disabled={parseInt(page) === 1}
          variant="secondary"
        >
          ← Предыдущая
        </Button>

        <Button
          onClick={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}/${parseInt(page) + 1}`,
            )
          }
          disabled={parseInt(page) === total_pages}
          variant="secondary"
        >
          Следующая →
        </Button>
      </div>
    )}
  </div>
);

export function File() {
  const { projectId = "0", fileId = "0", page = "1" } = useParams();
  const navigate = useNavigate();

  const [fileData, setFileData] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const response = await fetchFileById(projectId, fileId, page);
      setLoading(false);
      if (response === undefined) return;
      setFileData(response);
    };

    loadPage();
  }, [fileId, page, projectId]);

  const WordElement = ({ word }: { word: Word }) => {
    const isO = word.label === "O";

    return (
      <span className="inline-block mr-2 mb-1">
        <span className="font-medium text-gray-900">{word.token}</span>
        {!isO && (
          <span
            className={`ml-2 text-xs font-mono px-3 py-1 rounded-2xl select-none border ${
              word.label.startsWith("B-")
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : word.label.startsWith("I-")
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {word.label}
          </span>
        )}
      </span>
    );
  };

  if (loading && !fileData) {
    return (
      <div className="flex justify-center py-32">
        <Text variant="desc">Загрузка файла...</Text>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <Button onClick={() => navigate(`/projects/${projectId}/files`)}>
          Назад к списку файлов
        </Button>
      </div>
    );
  }

  const { name, total_rows, total_pages, rows } = fileData;

  return (
    <div>
      <Header>Файлы проекта</Header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-start mb-10">
          <div>
            <Text variant="header" className="text-4xl">
              {name}
            </Text>
            <Text variant="desc" className="mt-2">
              Всего строк: {total_rows} • Страница {page} из {total_pages}
            </Text>
          </div>

          <Button
            onClick={() => navigate(`/projects/${projectId}/files`)}
            variant="secondary"
          >
            Назад к файлам
          </Button>
        </div>

        <PageNavigate
          projectId={projectId}
          fileId={fileId}
          currentPage={page}
          totalPages={total_pages}
          navigate={navigate}
        />

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-10 text-[17px] leading-relaxed">
            {rows.map((line: Line, lineIndex: number) => (
              <div
                key={lineIndex}
                className="pb-8 border-b border-gray-100 last:border-none"
              >
                {line.words.map((word, wordIndex) => (
                  <WordElement key={wordIndex} word={word} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <PageNavigate
          projectId={projectId}
          fileId={fileId}
          currentPage={page}
          totalPages={total_pages}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
