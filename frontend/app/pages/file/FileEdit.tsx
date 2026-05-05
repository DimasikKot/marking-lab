import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import {
  type GetFilePageResponse,
  type Row,
  updateFileByIdContent,
} from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";

export function FileEdit({
  projectId,
  fileId,
  page,
  file,
  loading,
  hasUnsavedChanges,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  file: GetFilePageResponse;
  loading: boolean;
  hasUnsavedChanges: React.RefObject<boolean>;
}) {
  const navigate = useNavigate();
  const [localRows, setLocalRows] = useState<Row[]>(file.rows);
  const [isSaving, setIsSaving] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    setLocalRows(file.rows);
  }, [file]);

  const handleTokenChange = (
    lineIdx: number,
    wordIdx: number,
    newToken: string,
  ) => {
    const updatedRows = [...localRows];
    updatedRows[lineIdx].words[wordIdx].token = newToken;
    setLocalRows(updatedRows);
  };

  const handleKeyDown = (
    lineIdx: number,
    wordIdx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === " ") {
      e.preventDefault(); // предотвращаем обычный пробел

      const currentText = e.currentTarget.value.trim();
      if (!currentText) return;

      const updatedRows = [...localRows];

      // Добавляем новое слово после текущего
      updatedRows[lineIdx].words.splice(wordIdx + 1, 0, {
        token: "",
        label: "O",
      });

      setLocalRows(updatedRows);

      // Фокус на новое поле
      setTimeout(() => {
        inputRefs.current[lineIdx]?.[wordIdx + 1]?.focus();
      }, 10);
    }

    if (e.key === "Enter") {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    const result = await updateFileByIdContent(
      projectId,
      fileId,
      { new_rows: localRows },
      page,
    );
    setIsSaving(false);

    if (result) {
      toast.success("Изменения текста успешно сохранены!");
    } else {
      toast.error("Ошибка при сохранении");
    }
  };

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <ButtonPage
        onClick={() => navigate(`/projects/${projectId}?tab=files`)}
        isLoading={isSaving || loading}
      />

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        <div className="flex justify-end">
          <ButtonUI
            onClick={handleSave}
            disabled={isSaving || loading || !hasUnsavedChanges.current}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? "Сохранение..." : "Сохранить разметку"}
          </ButtonUI>
        </div>

        <TextUI variant="desc" className="flex justify-center mb-2">
          Страница {page} из {file?.total_pages}
        </TextUI>

        <PageNavigate
          className="mb-4"
          currentPage={page}
          totalPages={file?.total_pages || 1}
          onBack={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=edit&page=${page - 1}`,
            )
          }
          onNext={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=edit&page=${page + 1}`,
            )
          }
        />

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-10">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-8 border-b border-gray-100 last:border-none flex flex-wrap gap-2"
              >
                {line.words.map((word, wordIdx) => (
                  <input
                    key={wordIdx}
                    ref={(el) => {
                      if (!inputRefs.current[lineIdx])
                        inputRefs.current[lineIdx] = [];
                      inputRefs.current[lineIdx][wordIdx] = el;
                    }}
                    value={word.token}
                    onChange={(e) =>
                      handleTokenChange(lineIdx, wordIdx, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(lineIdx, wordIdx, e)}
                    className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none min-w-8 font-medium text-gray-900 transition-colors"
                    style={{ width: `${Math.max(word.token.length + 1, 4)}ch` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <TextUI variant="desc" className="flex justify-center mt-4">
          Страница {page} из {file?.total_pages}
        </TextUI>

        <PageNavigate
          className="mt-2"
          currentPage={page}
          totalPages={file?.total_pages || 1}
          onBack={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=edit&page=${page - 1}`,
            )
          }
          onNext={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=edit&page=${page + 1}`,
            )
          }
        />
      </div>
    </div>
  );
}
