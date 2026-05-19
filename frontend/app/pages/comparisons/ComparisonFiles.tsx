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

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {file1 && file2 ? (
            <FilesCompareContainer file1={file1} file2={file2} />
          ) : isLoadingFiles ? (
            <TextUI>Загрузка...</TextUI>
          ) : (
            <TextUI>Файлы не найдены</TextUI>
          )}
        </div>
      </div>
    </>
  );
}

const FilesCompareContainer = ({
  file1,
  file2,
}: {
  file1: FileFullResponse;
  file2: FileFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <TextUI variant="title" className="mb-4">
        {file1.name}
      </TextUI>

      <TextUI variant="title" className="mb-4">
        {file2.name}
      </TextUI>
    </div>
  );
};

function ComparisonPanel({ projectId }: { projectId: string | number }) {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<FileDbResponse[]>([]);
  const [models, setModels] = useState<ModelDbResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const loadList = async () => {
      if (type === "files") {
        const res = await fetchFiles(projectId);
        if (res) setFiles(res.data);
      } else {
        const res = await fetchModels(projectId);
        if (res) setModels(res.data);
      }
    };
    loadList();
  }, [type, projectId]);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < 2) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const items = type === "files" ? files : models;
  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Находим выбранные файлы для передачи в контейнер сравнения
  const file1 = files.find((f) => f.id === selectedIds[0]);
  const file2 = files.find((f) => f.id === selectedIds[1]);

  return (
    <>
      {!isComparing ? (
        <div className="border border-gray-200 rounded-4xl p-8 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <TextUI variant="header">
                Сравнение {type === "files" ? "файлов" : "моделей"}
              </TextUI>
              <TextUI variant="desc">
                Выберите ровно 2 объекта для параллельного просмотра
              </TextUI>
            </div>
            <div className="flex gap-4 items-center">
              <TextField
                value={search}
                setValue={setSearch}
                placeholder="Поиск по названию..."
                name="search"
              />
              <ButtonUI
                disabled={selectedIds.length !== 2}
                onClick={() => setIsComparing(true)}
              >
                Сравнить выбранное ({selectedIds.length}/2)
              </ButtonUI>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`p-5 border-2 rounded-3xl cursor-pointer transition-all flex items-center gap-4 ${
                  selectedIds.includes(item.id)
                    ? "border-blue-500 bg-blue-50/30"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <CheckboxUI
                  value={selectedIds.includes(item.id)}
                  onClick={() => toggleSelection(item.id)}
                />
                <div className="overflow-hidden">
                  <TextUI variant="title" className="truncate text-base">
                    {item.name}
                  </TextUI>
                  <TextUI variant="desc" className="text-xs">
                    ID: {item.id}
                  </TextUI>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {type === "files" && file1 && file2 ? (
            <FilesCompareContainer
              projectId={projectId}
              file1={file1}
              file2={file2}
            />
          ) : type === "models" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ModelCompareColumn
                projectId={projectId}
                modelId={selectedIds[0]}
              />
              <ModelCompareColumn
                projectId={projectId}
                modelId={selectedIds[1]}
              />
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

/*Контейнер для синхронизации двух файлов*/
function FilesCompareContainerOld({
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
