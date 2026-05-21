import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { TextUI } from "@/shared/components/TextUI";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TagSelector } from "@/shared/components/TagSelector";
import { type Row } from "@/shared/api/file";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { RightPanel } from "@/shared/components/RightPanel";
import { COLORS } from "@/shared/constants/tags";

type SelectedWord = [number, number];

export function FileLabel({
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

  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Состояния для создания метки
  const [editMode, setEditMode] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-200");

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const normalized = newTagName.trim().toLowerCase();

    const bTag = `B-${normalized}`;
    const iTag = `I-${normalized}`;

    setLocalTags((prev) => ({
      ...prev,
      [bTag]: normalized,
    }));

    setLocalColors((prev) => ({
      ...prev,
      [bTag]: selectedColor,
      [iTag]: selectedColor,
    }));

    setNewTagName("");
    setHasUnsavedChanges(true);
  };

  const handleChangeColor = (tagKey: string, color: string) => {
    const iTag = tagKey.replace("B-", "I-");

    const iColor = color.replace(/-(\d+)$/, (_, num) => {
      const newNum = Math.max(parseInt(num) - 100, 100);
      return `-${newNum}`;
    });

    setLocalColors((prev) => ({
      ...prev,
      [tagKey]: color,
      [iTag]: iColor,
    }));

    setHasUnsavedChanges(true);
  };

  const handleRenameTag = (tagKey: string, label: string) => {
    setHasUnsavedChanges(true);
    setLocalTags((prev) => ({
      ...prev,
      [tagKey]: label,
    }));
  };

  const removeTag = (tagKey: string) => {
    const iTag = tagKey.replace("B-", "I-");

    setLocalTags((prev) => {
      const next = { ...prev };
      delete next[tagKey];
      delete next[iTag];
      return next;
    });

    setLocalColors((prev) => {
      const next = { ...prev };
      delete next[tagKey];
      delete next[iTag];
      return next;
    });
  };

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
    <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
      <ButtonPage onClick={handleExitClick} isLoading={isSaving || isLoading} />

      <RightPanel>
        <div className="flex items-center justify-between mb-3">
          <ButtonUI
            onClick={() => setEditMode((v) => !v)}
            variant={editMode ? "primary" : "secondary"}
            className="mx-auto"
          >
            {editMode ? "Готово" : "Редактировать"}
          </ButtonUI>
        </div>

        {editMode ? (
          <>
            <div className="border-b border-gray-200 pb-4 mb-4 space-y-3">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Новая сущность (ORG, PER...)"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />

              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border transition 
            ${color} 
            ${selectedColor === color ? "ring-2 ring-black" : ""}`}
                  />
                ))}
              </div>

              <ButtonUI
                onClick={handleAddTag}
                variant="primary"
                className="mx-auto"
              >
                + Добавить метку
              </ButtonUI>
            </div>

            <div className="space-y-3">
              {Object.entries(localTags)
                .filter(([k]) => k.startsWith("B-"))
                .map(([tagKey, label]) => {
                  const iTag = tagKey.replace("B-", "I-");

                  return (
                    <div
                      key={tagKey}
                      className="rounded p-2 space-y-2 hover:bg-gray-50 transition"
                    >
                      {/* Заголовок */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${localColors[tagKey]}`}
                        >
                          {tagKey}
                        </span>
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${localColors[iTag]}`}
                        >
                          {iTag}
                        </span>

                        <input
                          defaultValue={label}
                          onBlur={(e) =>
                            handleRenameTag(tagKey, e.target.value)
                          }
                          className="ml-auto border rounded px-2 py-1 text-xs w-32"
                        />

                        <button
                          onClick={() => removeTag(tagKey)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Удалить метку"
                        >
                          🗑
                        </button>
                      </div>

                      {/* Цвета */}
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleChangeColor(tagKey, color)}
                            className={`w-6 h-6 rounded-full border ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        ) : (
          <>
            <button
              key="O"
              onClick={() => assignTag("O")}
              className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center cursor-pointer gap-3 transition-colors"
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
                  onClick={() => assignTag(tagKey)}
                  className="w-full px-2 py-2.5 text-left hover:bg-gray-100 flex items-center cursor-pointer gap-3 transition-colors"
                >
                  <span
                    className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-12 text-center rounded ${localColors[tagKey]}`}
                  >
                    {tagKey}
                  </span>

                  <span
                    onClick={() => assignTag(iTag)}
                    className={`font-mono text-sm font-medium px-1 py-0.5 h-min w-13 text-center rounded ${localColors[iTag]}`}
                  >
                    {iTag}
                  </span>

                  <TextUI variant="normal">{label}</TextUI>
                </button>
              );
            })}
          </>
        )}
      </RightPanel>

      <div className="border border-gray-200 rounded-4xl z-100 p-6 overflow-auto">
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

        {/* Разметка текста */}
        <div
          className="rounded-3xl border border-gray-200 p-6 bg-white"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="space-y-6">
            {localRows.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="pb-6 border-b border-gray-200 last:border-none last:pb-0 flex flex-wrap gap-2"
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
                        ${localColors[word.label] ?? ""}
                        ${isSelected ? "ring-2 ring-blue-500" : "hover:bg-gray-300"}
                      `}
                    >
                      <span className="font-normal text-xl select-none">
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

      {showTagMenu && (
        <TagSelector
          tags={localTags}
          colors={localColors}
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
