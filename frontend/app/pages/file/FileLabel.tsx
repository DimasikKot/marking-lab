import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TagSelector } from "@/shared/components/TagSelector";
import { type GetFilePageResponse, type Row } from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";

type SelectedWord = [number, number];

export function FileLabel({
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
  setHasUnsavedChanges,
}: {
  projectId: string | number;
  fileId: string | number;
  page: number;
  file: GetFilePageResponse | null;
  localRows: Row[];
  setLocalRows: React.Dispatch<React.SetStateAction<Row[]>>;
  isLoading: boolean;
  isSaving: boolean;
  handleSave: () => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  const handleWordMouseDown = (
    lineIdx: number,
    wordIdx: number,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    if (event.button === 2) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({ x: rect.left - 330, y: rect.top + 40 });
      setShowTagMenu(true);

      const isAlreadyInSelection = selectedWords.some(
        ([l, w]) => l === lineIdx && w === wordIdx,
      );
      if (!isAlreadyInSelection || selectedWords.length === 0) {
        setSelectedWords([[lineIdx, wordIdx]]);
      }
      return;
    }

    const newSelection: SelectedWord = [lineIdx, wordIdx];
    const isAlreadySelected = selectedWords.some(
      ([l, w]) => l === lineIdx && w === wordIdx,
    );

    if (event.shiftKey && selectedWords.length > 0) {
      const first = selectedWords[0];
      const startLine = Math.min(first[0], lineIdx);
      const endLine = Math.max(first[0], lineIdx);
      const newSel: SelectedWord[] = [];

      for (let l = startLine; l <= endLine; l++) {
        const startW = l === startLine ? Math.min(first[1], wordIdx) : 0;
        const endW =
          l === endLine
            ? Math.max(first[1], wordIdx)
            : localRows[l].words.length - 1;
        for (let w = startW; w <= endW; w++) {
          newSel.push([l, w]);
        }
      }
      setSelectedWords(newSel);
    } else if (isAlreadySelected && selectedWords.length === 1) {
      setSelectedWords([]);
    } else {
      setSelectedWords([newSelection]);
    }
  };

  const assignTag = (baseTag: string) => {
    if (selectedWords.length === 0) return;

    const updatedRows = [...localRows];

    selectedWords.forEach(([lineIdx, wordIdx], index) => {
      if (!updatedRows[lineIdx]?.words[wordIdx]) return;

      let newLabel = baseTag;

      if (baseTag !== "O" && selectedWords.length > 1) {
        newLabel =
          index === 0 ? `B${baseTag.slice(1)}` : `I${baseTag.slice(1)}`;
      }

      updatedRows[lineIdx].words[wordIdx].label = newLabel;
    });

    setLocalRows(updatedRows);
    setSelectedWords([]);
    setShowTagMenu(false);

    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showTagMenu) {
        setShowTagMenu(false);
        setSelectedWords([]);
      }
    };
    document.addEventListener("scroll", handleClickOutside);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showTagMenu]);

  return (
    <div className="relative max-w-6xl mx-auto m-2 mb-80">
      <ButtonPage onClick={handleExitClick} isLoading={isSaving || isLoading} />

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

        <TextUI variant="desc" className="flex justify-center mb-2">
          Страница {page} из {file?.total_pages}
        </TextUI>

        <PageNavigate
          className="mb-4"
          currentPage={page}
          totalPages={file?.total_pages || 1}
          onBack={handleBackClick}
          onNext={handleNextClick}
        />

        {/* Разметка текста */}
        <div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="space-y-6">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-6 border-b border-gray-100 last:border-none flex flex-wrap gap-1.5"
              >
                {line.words.map((word, wordIdx) => {
                  const isSelected = selectedWords.some(
                    ([l, w]) => l === lineIdx && w === wordIdx,
                  );

                  return (
                    <div
                      key={wordIdx}
                      onMouseDown={(event) =>
                        handleWordMouseDown(lineIdx, wordIdx, event)
                      }
                      className={`flex flex-col items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all
                        ${file?.colors?.[word.label] ?? ""}
                        ${isSelected ? "ring-2 ring-blue-500" : "hover:bg-gray-300"}
                      `}
                    >
                      <span className="font-medium text-xl text-gray-900 select-none">
                        {word.token}
                      </span>
                    </div>
                  );
                })}
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
          onBack={handleBackClick}
          onNext={handleNextClick}
        />
      </div>

      {/* Панель справа */}
      <div className="fixed right-4 top-18 max-h-11/12 w-80">
        <div
          className="bg-white shadow-2xl border border-gray-300 rounded-2xl z-50 w-80 h-full overflow-clip"
          onClick={(event) => event.stopPropagation()}
          onScroll={(event) => event.stopPropagation()}
        >
          <div className="py-2 w-80 h-full overflow-auto">
            {/* <button
              onClick={() => setShowTagMenu(true)}
              className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <span className="w-28 text-center material-icons">add</span>
              <TextUI variant="normal">Добавить метку</TextUI>
            </button> */}

            <button
              key="O"
              onClick={() => assignTag("O")}
              className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <span
                className={`font-mono text-md font-medium px-1 py-0.5 h-min w-28 text-center rounded`}
              >
                O
              </span>

              <TextUI variant="normal">Не сущность</TextUI>
            </button>

            {Object.entries(file?.tags ?? {}).map(([tagKey, label]) => {
              const iTag = tagKey.replace("B-", "I-");

              return (
                <button
                  key={tagKey}
                  onClick={() => assignTag(tagKey)}
                  className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                >
                  <span
                    className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-12 text-center rounded ${file?.colors?.[tagKey]}`}
                  >
                    {tagKey}
                  </span>

                  <span
                    onClick={() => assignTag(iTag)}
                    className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-13 text-center rounded ${file?.colors?.[iTag]}`}
                  >
                    {iTag}
                  </span>

                  <TextUI variant="normal">{label}</TextUI>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showTagMenu && (
        <TagSelector
          tags={file?.tags ?? {}}
          colors={file?.colors ?? {}}
          onSelect={assignTag}
          onClose={() => {
            setShowTagMenu(false);
            setSelectedWords([]);
          }}
          position={menuPosition}
        />
      )}
    </div>
  );
}
