import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import {
  fetchFileById,
  type GetFilePageResponse,
  type Row,
  type Word,
} from "@/shared/api/file";
import { ButtonPage } from "@/shared/components/ButtonPage";

export function File() {
  const { projectId = "0", fileId = "0" } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const navigate = useNavigate();

  const [file, setFile] = useState<GetFilePageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      const response = await fetchFileById(projectId, fileId, page);
      setLoading(false);
      if (response === undefined) return;
      setFile(response);
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
  return (
    <div>
      <Header title={`Файл "${file?.name}"`} />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}/files`)}
          isLoading={loading}
        />

        <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
          <div className="flex justify-center">
            <TextUI variant="desc" className="mb-4">
              Всего строк: {file?.total_rows} • Страница {page} из{" "}
              {file?.total_pages}
            </TextUI>
          </div>

          {file && (
            <PageNavigate
              className="mb-6"
              currentPage={page}
              totalPages={file?.total_pages}
              onBack={() =>
                navigate(
                  `/projects/${projectId}/files/${fileId}?page=${parseInt(page) - 1}`,
                )
              }
              onNext={() =>
                navigate(
                  `/projects/${projectId}/files/${fileId}?page=${parseInt(page) + 1}`,
                )
              }
            />
          )}

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
            <div className="space-y-10 text-[17px] leading-relaxed">
              {file?.rows.map((line: Row, lineIndex: number) => (
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

          {file && (
            <PageNavigate
              className="mt-6"
              currentPage={page}
              totalPages={file?.total_pages}
              onBack={() =>
                navigate(
                  `/projects/${projectId}/files/${fileId}?page=${parseInt(page) - 1}`,
                )
              }
              onNext={() =>
                navigate(
                  `/projects/${projectId}/files/${fileId}?page=${parseInt(page) + 1}`,
                )
              }
            />
          )}

          <div className="flex justify-center">
            <TextUI variant="desc" className="mt-4">
              Всего строк: {file?.total_rows} • Страница {page} из{" "}
              {file?.total_pages}
            </TextUI>
          </div>
        </div>
      </div>
    </div>
  );
}
