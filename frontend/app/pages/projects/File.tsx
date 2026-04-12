import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Header } from '@/shared/components/Header';
import { Text } from '@/shared/components/Text';
import { Button } from '@/shared/components/Button';

import { fetchFileById, type Word, type Line } from '@/shared/api/file';

export function File() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const navigate = useNavigate();

  const [fileData, setFileData] = useState<any>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFile = async () => {
      if (!projectId || !fileId) {
        setError("Не указан проект или файл");
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await fetchFileById(projectId, fileId, 1, 100);

      if (data) {
        setFileData(data);
        setLines(data.rows || []);           
        console.log("Успешно загружено строк:", data.rows?.length);
      } else {
        setError("Не удалось загрузить файл");
      }
      setLoading(false);
    };

    loadFile();
  }, [projectId, fileId]);

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

  if (loading) {
    return <div className="flex justify-center py-32"><Text variant="desc">Загрузка файла...</Text></div>;
  }

  if (error || lines.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <Text variant="error" className="text-xl mb-6">
          {error || "В файле нет данных для отображения"}
        </Text>
        <Button onClick={() => navigate(`/projects/${projectId}/files`)}>
          Назад к списку файлов
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header>Просмотр файла</Header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <Text variant="header" className="text-4xl">{fileData?.name || `Файл #${fileId}`}</Text>
            <Text variant="desc" className="mt-2">
              Всего строк: {fileData?.total_rows || lines.length}
            </Text>
          </div>

          <Button 
            onClick={() => navigate(`/projects/${projectId}/files`)} 
            variant="secondary"
          >
            Назад к файлам
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-10 text-[17px] leading-relaxed">
            {lines.map((line, lineIndex) => (
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
      </div>
    </div>
  );
}