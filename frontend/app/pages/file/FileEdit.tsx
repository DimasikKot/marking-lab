import { useNavigate } from "react-router-dom";
import { useRef } from "react";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { type Row } from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { RightPanel } from "@/shared/components/RightPanel";

export function FileEdit({
  projectId,
  fileId,
  page,
  totalPages,
  localTags,
  setLocalTags,
  localColors,
  setLocalColors,
  localRows,
  setLocalRows,
  isLoading,
  isSaving,
  handleSave,
  hasUnsavedChanges,
  setHasUnsavedChanges,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  totalPages: number;
  localTags: Record<string, string>;
  setLocalTags: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  localColors: Record<string, string>;
  setLocalColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  localRows: Row[];
  setLocalRows: React.Dispatch<React.SetStateAction<Row[]>>;
  isLoading: boolean;
  isSaving: boolean;
  handleSave: () => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Вы не сохранили изменения, хотите продолжить?"))
        return;
    }

    navigate(
      `/projects/${projectId}/files/${fileId}?tab=edit&page=${page - 1}`,
    );
  };

  const handleNextClick = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Вы не сохранили изменения, хотите продолжить?"))
        return;
    }

    navigate(
      `/projects/${projectId}/files/${fileId}?tab=edit&page=${page + 1}`,
    );
  };

  const handleExitClick = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Вы не сохранили изменения, хотите продолжить?"))
        return;
    }

    navigate(`/projects/${projectId}?tab=files`);
  };

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
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const cursorPos = input.selectionStart ?? 0;
    const text = input.value;

    // ================= SPACE =================
    if (event.key === " ") {
      event.preventDefault();

      const left = text.slice(0, cursorPos);
      const right = text.slice(cursorPos);

      setLocalRows((prev: Row[]) => {
        setHasUnsavedChanges(true);

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
    if (event.key === "Enter") {
      event.preventDefault();

      const left = text.slice(0, cursorPos);
      const right = text.slice(cursorPos);

      setLocalRows((prev: Row[]) => {
        setHasUnsavedChanges(true);

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
    if (event.key === "Backspace" && cursorPos === 0) {
      event.preventDefault();

      setLocalRows((prev) => {
        setHasUnsavedChanges(true);

        const newRows = [...prev];

        const line = newRows[lineIdx];
        const prevWord = line.words[wordIdx - 1];

        if (!prevWord) return prev;

        const newWords = [...line.words];

        const merged = prevWord.token + text;

        newWords[wordIdx - 1] = {
          ...prevWord,
          token: merged,
        };

        newWords.splice(wordIdx, 1);

        newRows[lineIdx] = { ...line, words: newWords };

        setTimeout(() => {
          const prevInput = inputRefs.current[lineIdx]?.[wordIdx - 1];
          prevInput?.focus();

          const len = prevInput?.value.length ?? 0;
          prevInput?.setSelectionRange(len, len);
        }, 0);

        return newRows;
      });
    }

    // ================= DELETE =================
    if (event.key === "Delete") {
      const isEnd = cursorPos === text.length;

      if (isEnd) {
        setLocalRows((prev) => {
          setHasUnsavedChanges(true);

          const newRows = [...prev];

          const line = newRows[lineIdx];
          const nextLine = newRows[lineIdx + 1];

          if (!nextLine) return prev;

          const currentWords = [...line.words];
          const nextWords = [...nextLine.words];

          const last = currentWords[currentWords.length - 1];

          const merged = last.token + nextWords[0].token;

          currentWords[currentWords.length - 1] = {
            ...last,
            token: merged,
          };

          newRows[lineIdx] = {
            ...line,
            words: [...currentWords, ...nextWords.slice(1)],
          };

          newRows.splice(lineIdx + 1, 1);

          return newRows;
        });

        event.preventDefault();
        return;
      }
    }

    // ================= ARROWS =================

    if (event.key === "ArrowRight") {
      if (cursorPos === text.length) {
        const next = inputRefs.current[lineIdx]?.[wordIdx + 1];

        if (next) {
          event.preventDefault();
          next.focus();
          next.setSelectionRange(0, 0);
        } else {
          const nextLine = inputRefs.current[lineIdx + 1]?.[0];
          if (nextLine) {
            event.preventDefault();
            nextLine.focus();
            nextLine.setSelectionRange(0, 0);
          }
        }
      }
    }

    if (event.key === "ArrowLeft") {
      if (cursorPos === 0) {
        const prev = inputRefs.current[lineIdx]?.[wordIdx - 1];

        if (prev) {
          event.preventDefault();
          prev.focus();
          prev.setSelectionRange(prev.value.length, prev.value.length);
        } else {
          const prevLine = inputRefs.current[lineIdx - 1];
          if (prevLine) {
            const lastIdx = prevLine.length - 1;
            const last = prevLine[lastIdx];

            if (last) {
              event.preventDefault();
              last.focus();
              last.setSelectionRange(last.value.length, last.value.length);
            }
          }
        }
      }
    }

    if (event.key === "ArrowDown") {
      const next = inputRefs.current[lineIdx + 1]?.[0];
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }

    if (event.key === "ArrowUp") {
      const prev = inputRefs.current[lineIdx - 1]?.[0];
      if (prev) {
        event.preventDefault();
        prev.focus();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
      <ButtonPage onClick={handleExitClick} isLoading={isLoading} />

      <RightPanel>
        <button
          key="O"
          className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
        >
          <span
            className={`font-mono text-md font-medium px-1 py-0.5 h-min w-28 text-center rounded`}
          >
            O
          </span>

          <TextUI variant="normal">Не сущность</TextUI>
        </button>

        {Object.entries(localTags).map(([tagKey, label]) => {
          const iTag = tagKey.replace("B-", "I-");

          return (
            <button
              key={tagKey}
              className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <span
                className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-12 text-center rounded ${localColors[tagKey]}`}
              >
                {tagKey}
              </span>

              <span
                className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-13 text-center rounded ${localColors[iTag]}`}
              >
                {iTag}
              </span>

              <TextUI variant="normal">{label}</TextUI>
            </button>
          );
        })}
      </RightPanel>

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-end">
          <ButtonUI
            onClick={handleSave}
            disabled={isSaving || isLoading || !hasUnsavedChanges}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? "Сохранение..." : "Сохранить разметку"}
          </ButtonUI>
        </div>

        <PageNavigate
          className="mb-2"
          currentPage={page}
          totalPages={totalPages}
          onBack={handleBackClick}
          onNext={handleNextClick}
        />

        <TextUI variant="desc" className="flex justify-center mb-4">
          Страница {page > totalPages ? totalPages : page} из {totalPages}
        </TextUI>

        {/* Редактор */}
        <div className="rounded-3xl border border-gray-200 p-6 bg-white">
          <div className="space-y-6">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-6 border-b border-gray-200 last:border-none last:pb-0 flex flex-wrap"
              >
                {line.words.map((word, wordIdx) => (
                  <div className="flex flex-col items-center py-0.5 rounded cursor-pointer transition-all">
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
                      className={`hover:ring-gray-300 hover:ring-2 focus:ring-blue-500 focus:ring-2 outline-none
                        min-w-1 font-normal text-xl mx-1 transition-colors
                        flex flex-col items-center gap-1 px-2 py-0.5 rounded
                        ${localColors[word.label] ?? ""}`}
                      style={{
                        width: `${word.token.length + 2}ch`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <TextUI variant="desc" className="flex justify-center mt-4">
          Страница {page > totalPages ? totalPages : page} из {totalPages}
        </TextUI>

        <PageNavigate
          className="mt-2"
          currentPage={page}
          totalPages={totalPages}
          onBack={handleBackClick}
          onNext={handleNextClick}
        />
      </div>
    </div>
  );
}
