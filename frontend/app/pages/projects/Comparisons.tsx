import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFileById,
  fetchFiles,
  type FileDbResponse,
  type GetFilePageResponse,
} from "@/shared/api/file";
import {
  fetchModels,
  type ModelDbResponse,
  fetchModelById,
} from "@/shared/api/model";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { CheckboxUI } from "@/shared/components/CheckboxUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { TextField } from "@/shared/components/TextField";

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

      <ComparisonPanel
        key={`${type}-${projectId}`}
        projectId={projectId}
        type={type}
      />
    </div>
  );
}

function ComparisonPanel({
  projectId,
  type,
}: {
  projectId: string | number;
  type: CompareType;
}) {
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
function FilesCompareContainer({
  projectId,
  file1,
  file2,
}: {
  projectId: string | number;
  file1: FileDbResponse;
  file2: FileDbResponse;
}) {
  const [page, setPage] = useState(1);
  const [data1, setData1] = useState<GetFilePageResponse | null>(null);
  const [data2, setData2] = useState<GetFilePageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Состояние чекбокса: true — только измененные, false — оба файла целиком
  const [onlyChanged, setOnlyChanged] = useState(false);

  // Рефы для синхронизации прокрутки
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  // Флаги для предотвращения бесконечного цикла событий onScroll
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        fetchFileById(projectId, file1.id, page, 10),
        fetchFileById(projectId, file2.id, page, 10),
      ]);
      setData1(res1 || null);
      setData2(res2 || null);
      setLoading(false);
    };
    load();
  }, [projectId, file1.id, file2.id, page]);

  const handleScroll1 = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingLeft.current) {
      isSyncingLeft.current = false;
      return;
    }
    if (scrollRef2.current) {
      isSyncingRight.current = true;
      scrollRef2.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleScroll2 = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }
    if (scrollRef1.current) {
      isSyncingLeft.current = true;
      scrollRef1.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const originId1 = (file1 as any).origin_file?.id;
  const originId2 = (file2 as any).origin_file?.id;
  const isLinked = originId1 === file2.id || originId2 === file1.id;

  let rows1 = data1?.rows || [];
  let rows2 = data2?.rows || [];

  // Фильтрация применяется только если файлы связаны И включен чекбокс onlyChanged
  if (isLinked && onlyChanged && data1 && data2) {
    const isFile1Annotated = originId1 === file2.id;
    const annotatedRows = isFile1Annotated ? data1.rows : data2.rows;

    // Находим индексы строк, где есть слова с тегом (label !== "O")
    const validIndices = annotatedRows.reduce((acc: number[], row: any, idx: number) => {
      if (row.words.some((w: any) => w.label !== "O")) {
        acc.push(idx);
      }
      return acc;
    }, []);

    // Оставляем только отфильтрованные строки
    rows1 = validIndices.map((idx) => data1.rows[idx]).filter(Boolean);
    rows2 = validIndices.map((idx) => data2.rows[idx]).filter(Boolean);
  }

  const totalPages = Math.max(data1?.total_pages || 1, data2?.total_pages || 1);

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
          dataName={data1?.name}
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
          dataName={data2?.name}
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

/*Колонки для моделей (без изменений)*/
function ModelCompareColumn({
  projectId,
  modelId,
}: {
  projectId: string | number;
  modelId: number;
}) {
  const [model, setModel] = useState<ModelDbResponse | null>(null);

  useEffect(() => {
    fetchModelById(projectId, modelId).then((res) => {
      if (res) setModel(res);
    });
  }, [projectId, modelId]);

  if (!model) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-4xl p-6 shadow-sm space-y-6">
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <TextUI variant="header" className="text-blue-600 truncate">
            {model.name}
          </TextUI>
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-600 text-xs font-bold">
            {model.progress}%
          </div>
        </div>
      </div>

      {/* Параметры */}
      <div>
        <TextUI
          variant="title"
          className="text-sm mb-3 text-gray-400 uppercase tracking-wider"
        >
          Параметры
        </TextUI>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(model.parameters).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between text-sm py-2 border-b border-gray-50"
            >
              <span className="text-gray-500">{k}</span>
              <span className="font-medium">{JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-3xl">
        <TextUI
          variant="title"
          className="text-sm mb-3 text-emerald-600 uppercase tracking-wider"
        >
          Метрики
        </TextUI>
        <div className="space-y-2">
          {Object.entries(model.metrics).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between items-center py-1 border-b border-emerald-100/50"
            >
              <span className="text-emerald-800/70 text-sm">{k}</span>
              <span className="text-emerald-700 font-bold">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Графики */}
      <div className="space-y-4">
        <TextUI
          variant="title"
          className="text-sm text-gray-400 uppercase tracking-wider"
        >
          Визуализация
        </TextUI>
        {Object.entries(model.graphs).map(([key, value]) => (
          <div
            key={key}
            className="border border-gray-100 rounded-3xl p-3 bg-gray-50/50"
          >
            <TextUI
              variant="label"
              className="mb-2 block text-center text-xs text-gray-500"
            >
              {key}
            </TextUI>
            <img
              src={value}
              alt={key}
              className="w-full rounded-2xl shadow-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}