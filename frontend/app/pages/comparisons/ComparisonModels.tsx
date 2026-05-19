import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { fetchModelById, type ModelFullResponse } from "@/shared/api/model";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";

export function ComparisonModels() {
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "0,0";

  // Переменные страницы
  const [file1, setFile1] = useState<ModelFullResponse | null>(null);
  const [file2, setFile2] = useState<ModelFullResponse | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const ids = ids_param
        .split(",") // Разделение на массив
        .map((id) => Number(id)) // Преобразование в число
        .slice(0, 2); // Максимум 2 модели

      setIsLoadingModels(true);
      const response1 = await fetchModelById(projectId, ids[0]);
      const response2 = await fetchModelById(projectId, ids[1]);
      setIsLoadingModels(false);
      if (response1 === undefined || response2 === undefined) return;
      setFile1(response1);
      setFile2(response2);
    };

    loadFiles();
  }, [projectId, ids_param]);

  return (
    <>
      <Header title="Сравнение моделей" />

      <div className="max-w-6xl mx-auto m-2">
        <ButtonPage onClick={() => window.history.back()} />

        {file1 && file2 ? (
          <ModelsCompareContainer
            projectId={projectId}
            file1={file1}
            file2={file2}
          />
        ) : isLoadingModels ? (
          <TextUI>Загрузка...</TextUI>
        ) : (
          <TextUI>Файлы не найдены</TextUI>
        )}
      </div>
    </>
  );
}

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
