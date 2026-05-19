import { Header } from "@/shared/components/Header";

export function ComparisonFiles() {
  return (
    <div>
      <Header title="Сравнение файлов" />

      <div className="max-w-6xl mx-auto m-2">
        <p>Список файлов</p>
      </div>
    </div>
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