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

export function FileEdit({
  projectId,
  fileId,
  page,
  file,
  loading,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  file: GetFilePageResponse | null;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const [localRows, setLocalRows] = useState<Row[]>(file?.rows || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleTokenChange = (
    lineIdx: number,
    wordIdx: number,
    newToken: string,
  ) => {
    const updatedRows = [...localRows];
    updatedRows[lineIdx].words[wordIdx].token = newToken;
    setLocalRows(updatedRows);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateFileByIdContent(
      projectId,
      fileId,
      { new_rows: localRows },
      page,
    );
    setIsSaving(false);
    if (result) {
      alert("Изменения текста сохранены!");
    }
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
          className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
        >
          {isSaving ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </div>

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        <div className="flex justify-center">
          <TextUI variant="desc" className="mb-4">
            Режим редактирования текста • Страница {page} из {file?.total_pages}
          </TextUI>
        </div>

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
                    value={word.token}
                    onChange={(e) =>
                      handleTokenChange(lineIdx, wordIdx, e.target.value)
                    }
                    className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none min-w-7.5 font-medium text-gray-900 transition-colors"
                    style={{ width: `${word.token.length + 1}ch` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {file && (
          <PageNavigate
            className="mt-6"
            currentPage={page}
            totalPages={file?.total_pages}
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
        )}
      </div>
    </div>
  );
}
