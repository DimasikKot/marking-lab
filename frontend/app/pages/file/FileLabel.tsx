import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TagSelector } from "@/shared/components/TagSelector";
import {
  type GetFilePageResponse,
  type Row,
  updateFileByIdContent,
} from "@/shared/api/file";
import { TAG_COLORS, type BioTag } from "@/shared/constants/tags";

type SelectedWord = [number, number]; // [lineIdx, wordIdx]

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

  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    setLocalRows(file.rows);
    setSelectedWords([]);
    setShowTagMenu(false);
    hasUnsavedChanges.current = false;
  }, [file]);

  const handleWordMouseDown = (
    lineIdx: number,
    wordIdx: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (e.button === 2) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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

    if (e.shiftKey && selectedWords.length > 0) {
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

  const assignTag = (baseTag: BioTag) => {
    if (selectedWords.length === 0) return;

    const updatedRows = [...localRows];

    selectedWords.forEach(([lineIdx, wordIdx], index) => {
      if (!updatedRows[lineIdx]?.words[wordIdx]) return;

      let newLabel: BioTag = baseTag;

      if (baseTag !== "O" && selectedWords.length > 1) {
        newLabel = (
          index === 0 ? `B${baseTag.slice(1)}` : `I${baseTag.slice(1)}`
        ) as BioTag;
      }

      updatedRows[lineIdx].words[wordIdx].label = newLabel;
    });

    setLocalRows(updatedRows);
    setSelectedWords([]);
    setShowTagMenu(false);

    hasUnsavedChanges.current = true;
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges.current) return;

    setIsSaving(true);
    try {
      await updateFileByIdContent(
        projectId,
        fileId,
        { new_rows: localRows },
        page,
      );
      hasUnsavedChanges.current = false;
      toast.success("Разметка успешно сохранена!");
    } catch {
      toast.error("Ошибка при сохранении разметки");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showTagMenu) {
        setShowTagMenu(false);
        setSelectedWords([]);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showTagMenu]);

  return (
    <div className="max-w-6xl mx-auto m-2 mb-80">
      <div className="flex justify-between items-center mb-4">
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=files`)}
          isLoading={loading}
        />
        <button
          onClick={handleSave}
          disabled={isSaving || loading || !hasUnsavedChanges.current}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
        >
          {isSaving ? "Сохранение..." : "Сохранить разметку"}
        </button>
      </div>

      <div className="border border-gray-200 rounded-4xl p-6 overflow-auto">
        <div className="flex justify-center mb-4">
          <TextUI variant="desc">
            Режим разметки • Страница {page} из {file?.total_pages}
          </TextUI>
        </div>

        <div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="space-y-10">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-8 border-b border-gray-100 last:border-none flex flex-wrap gap-3"
              >
                {line.words.map((word, wordIdx) => {
                  const isSelected = selectedWords.some(
                    ([l, w]) => l === lineIdx && w === wordIdx,
                  );

                  return (
                    <div
                      key={wordIdx}
                      onMouseDown={(e) =>
                        handleWordMouseDown(lineIdx, wordIdx, e)
                      }
                      className={`flex flex-col items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all hover:bg-gray-100 ${
                        isSelected ? "bg-blue-100 ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <span className="font-medium text-gray-900 select-none">
                        {word.token}
                      </span>
                      {word.label != "O" && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border text-center min-w-15 ${
                            TAG_COLORS[word.label] ??
                            "bg-gray-100 border-gray-300 text-gray-600"
                          }`}
                        >
                          {word.label}
                        </span>
                      )}
                    </div>
                  );
                })}
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

      {showTagMenu && (
        <TagSelector
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
