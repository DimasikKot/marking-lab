import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import {
  fetchFileById,
  type FileFullResponse,
  type Row,
  type Word,
} from "@/shared/api/file";
import { TextUI } from "@/shared/components/TextUI";
import { CheckboxUI } from "@/shared/components/CheckboxUI";

export function ComparisonFiles() {
  const navigate = useNavigate();
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

      <div className="max-w-6xl mx-auto m-6 mb-80">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=files`)}
        />

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {file1 && file2 ? (
            <div className="flex flex-col gap-4">
              <FileInfoRow file1={file1} file2={file2} />
              <FileRowsRow file1={file1} file2={file2} />
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
    <div className="w-full grid grid-cols-2 gap-8 sticky sm:top-52 lg:top-20 self-start">
      <FileInfoElement file={file1} />
      <FileInfoElement file={file2} />
    </div>
  );
};

const FileInfoElement = ({ file }: { file: FileFullResponse }) => {
  return (
    <div className="flex-1 h-full flex-col p-6 -m-2 border border-gray-300 rounded-2xl bg-white">
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
  file1,
  file2,
}: {
  file1: FileFullResponse;
  file2: FileFullResponse;
}) => {
  const [onlyDiff, setOnlyDiff] = useState(false);

  const originId1 = file1.origin_file?.id;
  const originId2 = file2.origin_file?.id;

  const isLinked = originId1 === file2.id || originId2 === file1.id;

  const rows1 = file1.rows;
  const rows2 = file2.rows;

  const syncedRows: SyncedRow[] = useMemo(() => {
    const maxLength = Math.max(rows1.length, rows2.length);

    const result = [];

    for (let i = 0; i < maxLength; i++) {
      const row1 = rows1[i];
      const row2 = rows2[i];

      const text1 = row1?.words?.map((w) => w.token).join(" ") || "";
      const text2 = row2?.words?.map((w) => w.token).join(" ") || "";

      const labels1 = row1?.words?.map((w) => w.label).join("|") || "";
      const labels2 = row2?.words?.map((w) => w.label).join("|") || "";

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

  return (
    <div className="flex flex-col w-full gap-6">
      {isLinked && (
        <CheckboxUI
          value={onlyDiff}
          title={"Показывать только различия"}
          onClick={() => setOnlyDiff((prev) => !prev)}
        />
      )}

      <div className="grid grid-cols-2 gap-6">
        <FileRowsElement file={file1} syncedRows={syncedRows} side="left" />
        <FileRowsElement file={file2} syncedRows={syncedRows} side="right" />
      </div>
    </div>
  );
};

const FileRowsElement = ({
  file,
  syncedRows,
  side,
}: {
  file: FileFullResponse;
  syncedRows: SyncedRow[];
  side: "left" | "right";
}) => {
  return (
    <div className="flex flex-col overflow-hidden bg-white">
      <div className="space-y-4">
        {syncedRows.map((item) => {
          const row = side === "left" ? item.row1 : item.row2;

          return (
            <div
              key={item.index}
              className={`
                rounded-2xl border p-4 transition-all
                ${
                  item.isDifferent
                    ? "border-orange-200 bg-orange-50"
                    : "border-gray-200"
                }
              `}
            >
              <div className="flex flex-wrap gap-2">
                {row?.words?.map((word: Word, idx: number) => (
                  <span
                    key={idx}
                    className={`
                        px-2 py-1 rounded-lg text-sm
                        ${file.colors?.[word.label] || ""}
                      `}
                  >
                    {word.token}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
