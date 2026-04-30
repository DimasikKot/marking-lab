import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import {
  type GetFilePageResponse,
  type Row,
  updateFileByIdContent,
} from "@/shared/api/file";

export function FileLabel({
  projectId,
  fileId,
  page,
  file,
  loading,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  file: GetFilePageResponse;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const [localRows, setLocalRows] = useState<Row[]>(file.rows);
  const [isSaving, setIsSaving] = useState(false);

  const handleLabelChange = (
    lineIdx: number,
    wordIdx: number,
    newLabel: string,
  ) => {
    const updatedRows = [...localRows];
    updatedRows[lineIdx].words[wordIdx].label = newLabel;
    setLocalRows(updatedRows);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateFileByIdContent(
      projectId,
      fileId,
      { new_rows: localRows },
      page,
    );
    setIsSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <div className="flex justify-between items-center mb-4">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=files`)}
          isLoading={loading}
        />
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
        >
          {isSaving ? "Сохранение..." : "Сохранить разметку"}
        </button>
      </div>

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        <div className="flex justify-center">
          <TextUI variant="desc" className="mb-4">
            Режим разметки (Labeling) • Страница {page} из {file?.total_pages}
          </TextUI>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-10">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-8 border-b border-gray-100 last:border-none flex flex-wrap gap-6"
              >
                {line.words.map((word, wordIdx) => (
                  <div
                    key={wordIdx}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="font-medium text-gray-900">
                      {word.token}
                    </span>
                    <input
                      value={word.label}
                      onChange={(e) =>
                        handleLabelChange(lineIdx, wordIdx, e.target.value)
                      }
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border outline-none text-center ${
                        word.label === "O"
                          ? "border-gray-200 text-gray-400"
                          : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}
                      style={{
                        width: `${Math.max(word.label.length + 4, 4)}ch`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <PageNavigate
          className="mt-6"
          currentPage={page}
          totalPages={file?.total_pages || 1}
          onBack={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=label&page=${page - 1}`,
            )
          }
          onNext={() =>
            navigate(
              `/projects/${projectId}/files/${fileId}?tab=label&page=${page + 1}`,
            )
          }
        />
      </div>
    </div>
  );
}
