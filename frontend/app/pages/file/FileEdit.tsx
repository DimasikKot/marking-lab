import { useNavigate } from "react-router-dom";
import { useRef } from "react";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { type GetFilePageResponse, type Row } from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";

export function FileEdit({
  projectId,
  fileId,
  page,
  file,
  localRows,
  setLocalRows,
  isLoading,
  isSaving,
  handleSave,
  hasUnsavedChanges,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  file: GetFilePageResponse | null;
  localRows: Row[];
  setLocalRows: (rows: Row[]) => void;
  isLoading: boolean;
  isSaving: boolean;
  handleSave: () => void;
  hasUnsavedChanges: React.RefObject<boolean>;
}) {
  const navigate = useNavigate();

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

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
    const input = e.currentTarget;
    const cursorPos = input.selectionStart ?? 0;
    const text = input.value;

    // ================= SPACE =================
    if (e.key === " ") {
      e.preventDefault();

      const left = text.slice(0, cursorPos);
      const right = text.slice(cursorPos);

      setLocalRows((prev) => {
        hasUnsavedChanges.current = true;

        return prev.map((line, li) => {
          if (li !== lineIdx) return line;

          const newWords = [...line.words];

          newWords[wordIdx] = {
            ...newWords[wordIdx],
            token: left,
          };

          newWords.splice(wordIdx + 1, 0, {
            token: right,
            label: "O",
          });

          return { ...line, words: newWords };
        });
      });

      setTimeout(() => {
        inputRefs.current[lineIdx]?.[wordIdx + 1]?.focus();
      }, 0);
    }

    // ================= ENTER =================
    if (e.key === "Enter") {
      e.preventDefault();

      const left = text.slice(0, cursorPos);
      const right = text.slice(cursorPos);

      setLocalRows((prev) => {
        hasUnsavedChanges.current = true;

        const newRows = [...prev];
        const currentLine = prev[lineIdx];

        const before = currentLine.words.slice(0, wordIdx);
        const after = currentLine.words.slice(wordIdx + 1);

        const newCurrentLine = {
          ...currentLine,
          words: [
            ...before,
            {
              ...currentLine.words[wordIdx],
              token: left,
            },
          ],
        };

        const newNextLine = {
          words: [
            {
              token: right,
              label: "O",
            },
            ...after,
          ],
        };

        newRows[lineIdx] = newCurrentLine;
        newRows.splice(lineIdx + 1, 0, newNextLine);

        return newRows;
      });

      setTimeout(() => {
        inputRefs.current[lineIdx + 1]?.[0]?.focus();
      }, 0);
    }

    // ================= BACKSPACE =================
    if (e.key === "Backspace" && cursorPos === 0) {
      const line = localRows[lineIdx];
      const prevWord = line.words[wordIdx - 1];

      if (prevWord) {
        e.preventDefault();

        setLocalRows((prev) => {
          hasUnsavedChanges.current = true;

          const newRows = [...prev];
          const newWords = [...line.words];

          const merged = prevWord.token + text;

          newWords[wordIdx - 1] = {
            ...prevWord,
            token: merged,
          };

          newWords.splice(wordIdx, 1);

          newRows[lineIdx] = { ...line, words: newWords };

          return newRows;
        });

        setTimeout(() => {
          const prevInput = inputRefs.current[lineIdx]?.[wordIdx - 1];
          prevInput?.focus();

          const len = prevInput?.value.length ?? 0;
          prevInput?.setSelectionRange(len, len);
        }, 0);
      }
    }

    // ================= ARROW RIGHT =================
    if (e.key === "ArrowRight") {
      if (cursorPos === text.length) {
        const nextInput = inputRefs.current[lineIdx]?.[wordIdx + 1];
        if (nextInput) {
          e.preventDefault();
          nextInput.focus();
          nextInput.setSelectionRange(0, 0);
        }
      }
    }

    // ================= ARROW LEFT =================
    if (e.key === "ArrowLeft") {
      if (cursorPos === 0) {
        const prevInput = inputRefs.current[lineIdx]?.[wordIdx - 1];
        if (prevInput) {
          e.preventDefault();
          prevInput.focus();

          const len = prevInput.value.length;
          prevInput.setSelectionRange(len, len);
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <ButtonPage
        onClick={() => navigate(`/projects/${projectId}?tab=files`)}
        isLoading={isLoading}
      />

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-end">
          <ButtonUI
            onClick={handleSave}
            disabled={isSaving || isLoading || !hasUnsavedChanges.current}
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

        {/* Редактор */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="space-y-6">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-6 border-b border-gray-100 last:border-none flex flex-wrap gap-1.5"
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
                    className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none
                    min-w-8 font-medium text-xl py-0.5 text-gray-900 transition-colors"
                    style={{ width: `${Math.max(word.token.length + 1, 3)}ch` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
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
