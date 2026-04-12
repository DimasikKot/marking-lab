import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Header } from '@/shared/components/Header';
import { Text } from '@/shared/components/Text';
import { Button } from '@/shared/components/Button';

import { fetchFileById, type FileDetail, type Line, type Word } from '@/shared/api/file';

export function File() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const navigate = useNavigate();

  const [fileData, setFileData] = useState<FileDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rowsPerPage = 40;

  // Функция загрузки конкретной страницы
  const loadPage = useCallback(async (page: number) => {
    if (!projectId || !fileId) {
      setError("Не указан проект или файл");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchFileById(projectId, fileId, page, rowsPerPage);
      
      if (data) {
        setFileData(data);
        setCurrentPage(page);
      } else {
        setError("Не удалось загрузить страницу файла");
      }
    } catch (err) {
      setError("Произошла ошибка при загрузке файла");
    } finally {
      setLoading(false);
    }
  }, [projectId, fileId]);
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const TokenElement = ({ token }: { token: Word }) => {
    const isO = token.label === "O";

    return (
      <span className="inline-block mr-4 mb-3">
        <span className="font-medium text-gray-900">{token.token}</span>
        {!isO && (
          <span
            className={`ml-2 text-xs font-mono px-3 py-1 rounded-2xl border ${
              token.label.startsWith("B-")
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : token.label.startsWith("I-")
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {token.label}
          </span>
        )}
      </span>
    );
  };

  if (loading && !fileData) {
    return <div className="flex justify-center py-32"><Text variant="desc">Загрузка файла...</Text></div>;
  }

  if (error || !fileData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <Text variant="error" className="text-xl mb-6">
          {error || "Не удалось загрузить файл"}
        </Text>
        <Button onClick={() => navigate(`/projects/${projectId}/files`)}>
          Назад к списку файлов
        </Button>
      </div>
    );
  }

  const { name, total_rows, total_pages, rows } = fileData;

  return (
    <div>
      <Header>Просмотр файла</Header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <Text variant="header" className="text-4xl">{name}</Text>
            <Text variant="desc" className="mt-2">
              Всего строк: {total_rows} • Страница {currentPage} из {total_pages}
            </Text>
          </div>

          <Button 
            onClick={() => navigate(`/projects/${projectId}/files`)} 
            variant="secondary"
          >
            Назад к файлам
          </Button>
        </div>

        {total_pages > 1 && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => loadPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              variant="secondary"
            >
              ← Предыдущая
            </Button>
            <Button
              onClick={() => loadPage(currentPage + 1)}
              disabled={currentPage === total_pages || loading}
              variant="secondary"
            >
              Следующая →
            </Button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-10 text-[17px] leading-relaxed">
            {rows.map((line: Line, lineIndex: number) => (
              <div
                key={lineIndex}
                className="pb-8 border-b border-gray-100 last:border-none"
              >
                {line.words.map((token, tokenIndex) => (
                  <TokenElement key={tokenIndex} token={token} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {total_pages > 1 && (
          <div className="flex gap-3 mt-8 justify-center">
            <Button
              onClick={() => loadPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              variant="secondary"
            >
              ← Предыдущая страница
            </Button>
            <Button
              onClick={() => loadPage(currentPage + 1)}
              disabled={currentPage === total_pages || loading}
              variant="secondary"
            >
              Следующая страница →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}