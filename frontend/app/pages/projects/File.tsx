import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import {
  fetchFileById,
  type FileDetail,
  type Line,
  type Word,
} from "@/shared/api/file";
import { ButtonBack } from "@/shared/components/ButtonBack";

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
        <TextUI variant="desc">Загрузка файла...</TextUI>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <ButtonUI onClick={() => navigate(`/projects/${projectId}/files`)}>
          Назад к списку файлов
        </ButtonUI>
      </div>
    );
  }

  const { name, total_rows, total_pages, rows } = fileData;

  return (
    <div>
      <Header>Файл "{name}"</Header>

      <div className="max-w-6xl mx-auto m-6">
        <ButtonBack onClick={() => navigate(`/projects/${projectId}/files`)} />

        <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
          <div className="flex justify-between items-start">
            <TextUI variant="desc" className="mt-2">
              Всего строк: {total_rows} • Страница {page} из {total_pages}
            </TextUI>
          </div>

          <PageNavigate
            currentPage={page}
            totalPages={total_pages}
            onBack={() =>
              navigate(
                `/projects/${projectId}/files/${fileId}/${parseInt(page) - 1}`,
              )
            }
            onNext={() =>
              navigate(
                `/projects/${projectId}/files/${fileId}/${parseInt(page) + 1}`,
              )
            }
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
            className="mt-6"
            currentPage={page}
            totalPages={total_pages}
            onBack={() =>
              navigate(
                `/projects/${projectId}/files/${fileId}/${parseInt(page) - 1}`,
              )
            }
            onNext={() =>
              navigate(
                `/projects/${projectId}/files/${fileId}/${parseInt(page) + 1}`,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
