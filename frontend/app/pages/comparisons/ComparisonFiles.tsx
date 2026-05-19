import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { fetchFileById, type FileFullResponse } from "@/shared/api/file";
import { TextUI } from "@/shared/components/TextUI";

export function ComparisonFiles() {
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "0,0";

  // Переменные страницы
  const [file1, setFile1] = useState<FileFullResponse | null>(null);
  const [file2, setFile2] = useState<FileFullResponse | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const ids = ids_param
        .split(",") // Разделение на массив
        .map((id) => Number(id)) // Преобразование в число
        .slice(0, 2); // Максимум 2 файлы

      setIsLoadingFiles(true);
      const response1 = await fetchFileById(projectId, ids[0], 1);
      const response2 = await fetchFileById(projectId, ids[1], 1);
      setIsLoadingFiles(false);
      if (response1 === undefined || response2 === undefined) return;
      setFile1(response1);
      setFile2(response2);
    };

    loadFiles();
  }, [projectId, ids_param]);

  return (
    <>
      <Header title="Сравнение файлов" />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage onClick={() => window.history.back()} />

        {file1 && file2 ? (
          <FilesCompareContainer
            projectId={projectId}
            file1={file1}
            file2={file2}
          />
        ) : isLoadingFiles ? (
          <TextUI>Загрузка...</TextUI>
        ) : (
          <TextUI>Файлы не найдены</TextUI>
        )}
      </div>
    </>
  );
}

/*Контейнер для синхронизации двух файлов*/
function FilesCompareContainer({
  file1,
  file2,
}: {
  projectId: string | number;
  file1: FileFullResponse;
  file2: FileFullResponse;
}) {
  const [page, setPage] = useState(1);

  // Состояние чекбокса: true — только измененные, false — оба файла целиком
  const [onlyChanged, setOnlyChanged] = useState(false);

  const originId1 = file1.origin_file?.id;
  const originId2 = file2.origin_file?.id;
  const isLinked = originId1 === file2.id || originId2 === file1.id;

  let rows1 = file1?.rows || [];
  let rows2 = file2?.rows || [];

  // Фильтрация применяется только если файлы связаны И включен чекбокс onlyChanged
  if (isLinked && onlyChanged && file1 && file2) {
    const isFile1Annotated = originId1 === file2.id;
    const annotatedRows = isFile1Annotated ? file1.rows : file2.rows;

    // Находим индексы строк, где есть слова с тегом (label !== "O")
    const validIndices = annotatedRows.reduce(
      (acc: number[], row: any, idx: number) => {
        if (row.words.some((w: any) => w.label !== "O")) {
          acc.push(idx);
        }
        return acc;
      },
      [],
    );

    // Оставляем только отфильтрованные строки
    rows1 = validIndices.map((idx) => file1.rows[idx]).filter(Boolean);
    rows2 = validIndices.map((idx) => file2.rows[idx]).filter(Boolean);
  }

  const totalPages = Math.max(file1?.total_pages || 1, file2?.total_pages || 1);

  return (
    <div className="w-full space-y-4">
      {/* Отображаем переключатель только если файлы связаны */}
      {isLinked && (
        <div className="flex items-center gap-3 bg-white px-5 py-3 border border-gray-200 rounded-3xl shadow-sm max-w-max">
          <CheckboxUI
            value={onlyChanged}
            onClick={() => setOnlyChanged(!onlyChanged)}
          />
          <span
            className="text-sm font-medium text-gray-600 cursor-pointer select-none"
            onClick={() => setOnlyChanged(!onlyChanged)}
          >
            Показывать только измененные строки
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <FileCompareColumn
          file={file1}
          dataName={file1?.name}
          rows={rows1}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          loading={loading}
          scrollRef={scrollRef1}
          onScroll={handleScroll1}
        />
        <FileCompareColumn
          file={file2}
          dataName={file2?.name}
          rows={rows2}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          loading={loading}
          scrollRef={scrollRef2}
          onScroll={handleScroll2}
        />
      </div>
    </div>
  );
}

/* Колонка для файла */
function FileCompareColumn({
  file,
  dataName,
  rows,
  page,
  totalPages,
  setPage,
  loading,
  scrollRef,
  onScroll,
}: {
  file: FileDbResponse;
  dataName?: string;
  rows: any[];
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
  if (!dataName && loading)
    return <div className="p-10 text-center">Загрузка...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-4xl overflow-hidden shadow-sm flex flex-col h-200">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <TextUI variant="title" className="text-sm truncate max-w-50">
          {dataName || file.name || `ID: ${file.id}`}
        </TextUI>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="material-icons p-1 hover:bg-gray-200 rounded-full disabled:opacity-30"
          >
            chevron_left
          </button>
          <TextUI variant="label" className="text-xs">
            Стр. {page}
          </TextUI>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="material-icons p-1 hover:bg-gray-200 rounded-full disabled:opacity-30"
          >
            chevron_right
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="p-4 overflow-y-auto flex-1 space-y-3"
      >
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="p-3 border border-gray-100 rounded-2xl hover:border-blue-200 transition-colors bg-white"
          >
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {row.words.map((w: any, wIdx: number) => (
                <div key={wIdx} className="flex flex-col items-center">
                  {w.label !== "O" && (
                    <span className="text-[10px] font-bold text-blue-500 leading-none mb-0.5">
                      {w.label}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-sm ${
                      w.label !== "O"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "text-gray-700"
                    }`}
                  >
                    {w.token}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-10">
            Нет строк для отображения
          </div>
        )}
      </div>
    </div>
  );
}
