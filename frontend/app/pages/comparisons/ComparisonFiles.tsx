import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { CheckboxUI } from "@/shared/components/CheckboxUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import {
  fetchFileById,
  type FileFullResponse,
  type Row,
  type Word,
} from "@/shared/api/file";
import { RightPanel } from "@/shared/components/RightPanel";

export function ComparisonFiles() {
  const navigate = useNavigate();
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "0,0";
  const page_param = searchParams.get("page") || "1";
  const [page, setPage] = useState(Number(page_param));

  // Переменные страницы
  const [file1, setFile1] = useState<FileFullResponse | null>(null);
  const [file2, setFile2] = useState<FileFullResponse | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const mergedTags = {
    ...(file1?.tags ?? {}),
    ...(file2?.tags ?? {}),
  };

  const mergedColors = {
    ...(file1?.colors ?? {}),
    ...(file2?.colors ?? {}),
  };

  const isLinkedOriginal =
    file1?.origin_file?.id === file2?.id
      ? 2
      : file2?.origin_file?.id === file1?.id
        ? 1
        : 0;

  useEffect(() => {
    const loadFiles = async () => {
      const ids = ids_param
        .split(",") // Разделение на массив
        .map((id) => Number(id)) // Преобразование в число
        .slice(0, 2); // Максимум 2 файлы

      setIsLoadingFiles(true);
      const response1 = await fetchFileById(projectId, ids[0], page_param);
      const response2 = await fetchFileById(projectId, ids[1], page_param);
      setIsLoadingFiles(false);
      if (response1 === undefined || response2 === undefined) return;
      setFile1(response1);
      setFile2(response2);
      setPage(Math.max(response1.page, response2.page));
    };

    loadFiles();
  }, [projectId, ids_param, page_param]);

  return (
    <>
      <Header title="Сравнение файлов" />

      <div className="max-w-6xl mx-auto m-6 mb-80">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=files`)}
          isLoading={isLoadingFiles}
        />

        <RightPanel>
          {Object.entries(mergedTags).map(([tagKey, label]) => {
            const iTag = tagKey.replace("B-", "I-");

            return (
              <button
                key={tagKey}
                className="w-full px-2 py-2.5 text-left flex items-center gap-3 transition-colors"
              >
                <span
                  className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-12 text-center rounded ${mergedColors[tagKey]}`}
                >
                  {tagKey}
                </span>

                <span
                  className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-13 text-center rounded ${mergedColors[iTag]}`}
                >
                  {iTag}
                </span>

                <TextUI variant="normal">{label}</TextUI>
              </button>
            );
          })}
        </RightPanel>

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {file1 && file2 ? (
            <div className="flex flex-col gap-4">
              <FileInfoRow
                file1={isLinkedOriginal === 2 ? file2 : file1}
                file2={isLinkedOriginal === 2 ? file1 : file2}
              />
              <FileRowsRow
                projectId={projectId}
                page={Number(page)}
                file1={isLinkedOriginal === 2 ? file2 : file1}
                file2={isLinkedOriginal === 2 ? file1 : file2}
                mergedColors={mergedColors}
                isLinkedParam={isLinkedOriginal != 0}
              />
            </div>
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

const FileInfoRow = ({
  file1,
  file2,
}: {
  file1: FileFullResponse;
  file2: FileFullResponse;
}) => {
  return (
    <div className="w-full grid grid-cols-2 gap-8 sticky sm:top-47 lg:top-15 self-start">
      <FileInfoElement file={file1} />
      <FileInfoElement file={file2} />
    </div>
  );
};

const FileInfoElement = ({ file }: { file: FileFullResponse }) => {
  return (
    <div className="flex-1 flex-col p-4 -m-2 border border-gray-300 rounded-2xl bg-white">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex w-full flex-row gap-2">
          <TextUI variant="title" maxLines={1} className="-mt-1">
            {file.name}
          </TextUI>
        </div>

        <div
          className={`flex items-center justify-center select-none material-icons 
            ${file.is_labeled ? "text-green-500" : "text-gray-500"}`}
        >
          {file.is_labeled ? "sell" : "help_outline"}
        </div>
      </div>

      {file.total_rows && (
        <TextUI variant="desc" maxLines={1} className="mt-1">
          <strong>Строк:</strong> {file.total_rows}
        </TextUI>
      )}

      {file.prediction_model && (
        <TextUI variant="desc" maxLines={1} className="mt-1">
          <strong>Размечен моделью:</strong> {file.prediction_model.name}
          {" ("}
          {file.prediction_model.parameters["Базовая модель"] &&
            String(file.prediction_model.parameters["Базовая модель"])
              .split("/")
              .pop()}
          {")"}
        </TextUI>
      )}

      {file.origin_file && (
        <TextUI variant="desc" maxLines={1} className="mt-1">
          <strong>Исходный файл:</strong> {file.origin_file.name}
        </TextUI>
      )}
    </div>
  );
};

interface SyncedRow {
  index: number;
  row1: Row;
  row2: Row;
  isDifferent: boolean;
}

const FileRowsRow = ({
  projectId,
  page,
  file1,
  file2,
  mergedColors,
  isLinkedParam,
}: {
  projectId: string | number;
  page: number;
  file1: FileFullResponse;
  file2: FileFullResponse;
  mergedColors: Record<string, string>;
  isLinkedParam: boolean;
}) => {
  const navigate = useNavigate();
  const [isLinked, setIsLinked] = useState(isLinkedParam);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const rows1 = file1.rows;
  const rows2 = file2.rows;

  const syncedRows: SyncedRow[] = useMemo(() => {
    const maxLength = Math.max(rows1.length, rows2.length);

    const result = [];

    for (let i = 0; i < maxLength; i++) {
      const row1 = rows1[i];
      const row2 = rows2[i];

      const text1 = row1?.words?.map((word) => word.token).join(" ") || "";
      const text2 = row2?.words?.map((word) => word.token).join(" ") || "";

      const labels1 = row1?.words?.map((word) => word.label).join("|") || "";
      const labels2 = row2?.words?.map((word) => word.label).join("|") || "";

      const isDifferent = text1 !== text2 || labels1 !== labels2;

      result.push({
        index: i,
        row1,
        row2,
        isDifferent,
      });
    }

    if (onlyDiff) {
      return result.filter((row) => row.isDifferent);
    }

    return result;
  }, [rows1, rows2, onlyDiff]);

  const handleBackClick = () => {
    navigate(
      `/projects/${projectId}/files/compare?ids=${file1.id},${file2.id}&page=${page - 1}`,
    );
  };

  const handleNextClick = () => {
    navigate(
      `/projects/${projectId}/files/compare?ids=${file1.id},${file2.id}&page=${page + 1}`,
    );
  };

  return (
    <div className="flex flex-col w-full items-center gap-2 mt-2">
      {!isLinkedParam && (
        <CheckboxUI
          value={isLinked}
          title={"Связанные файлы"}
          onClick={() => setIsLinked((prev) => !prev)}
        />
      )}

      {isLinked && (
        <CheckboxUI
          value={onlyDiff}
          title={"Показывать только различия"}
          onClick={() => setOnlyDiff((prev) => !prev)}
        />
      )}

      <PageNavigate
        currentPage={page}
        totalPages={Math.max(file1.total_pages, file2.total_pages)}
        onBack={handleBackClick}
        onNext={handleNextClick}
      />

      <div className="grid grid-cols-2 gap-6">
        <FileRowsElement
          totalPages={file1.total_pages}
          mergedColors={mergedColors}
          page={page}
          syncedRows={syncedRows}
          side="left"
          onlyDiff={onlyDiff}
          isLinked={isLinked}
        />

        <FileRowsElement
          totalPages={file2.total_pages}
          mergedColors={mergedColors}
          page={page}
          syncedRows={syncedRows}
          side="right"
          onlyDiff={onlyDiff}
          isLinked={isLinked}
        />
      </div>

      <PageNavigate
        currentPage={page}
        totalPages={Math.max(file1.total_pages, file2.total_pages)}
        onBack={handleBackClick}
        onNext={handleNextClick}
      />
    </div>
  );
};

const FileRowsElement = ({
  totalPages,
  mergedColors,
  page,
  syncedRows,
  side,
  onlyDiff,
  isLinked,
}: {
  totalPages: number;
  mergedColors: Record<string, string>;
  page: number;
  syncedRows: SyncedRow[];
  side: "left" | "right";
  onlyDiff: boolean;
  isLinked: boolean;
}) => {
  return (
    <div>
      <TextUI variant="desc" className="flex justify-center mb-4">
        Страница {page > totalPages ? totalPages : page} из {totalPages}
      </TextUI>

      <div
        className={`flex flex-col rounded-3xl border p-6 overflow-hidden gap-6 bg-white
                ${onlyDiff && side === "right" ? "border-orange-300" : "border-gray-200"}`}
      >
        {syncedRows.map((item) => {
          const row = side === "left" ? item.row1 : item.row2;

          return (
            <>
              {row?.words?.length > 0 && (
                <div
                  className={`pb-6 last:border-none last:pb-0 border-b
                ${onlyDiff && side === "right" ? "border-orange-300" : "border-gray-200"}
              `}
                >
                  <div
                    key={item.index}
                    className={`rounded-2xl p-2 -m-2
                ${isLinked && item.isDifferent && !onlyDiff && side === "right" && "bg-orange-50"}
              `}
                  >
                    <div className="flex flex-wrap gap-1">
                      {row?.words?.map((word: Word, idx: number) => (
                        <span
                          key={idx}
                          className={`
                        px-2 py-1 rounded-lg font-normal text-xl
                        ${mergedColors[word.label] || ""}
                      `}
                        >
                          {word.token}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })}
      </div>

      <TextUI variant="desc" className="flex justify-center mt-4">
        Страница {page > totalPages ? totalPages : page} из {totalPages}
      </TextUI>
    </div>
  );
};
