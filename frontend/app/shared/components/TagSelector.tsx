import { BIO_TAGS, TAG_COLORS, type BioTag } from "@/shared/constants/tags";
import { TextUI } from "./TextUI";

type Props = {
  onSelect: (tag: BioTag) => void;
  onClose: () => void;
  position?: { x: number; y: number };
};

export function TagSelector({ onSelect, onClose, position }: Props) {
  return (
    <div
      className="fixed bg-white shadow-2xl border border-gray-300 rounded-2xl z-50 w-80 max-h-96 overflow-clip"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
      onClick={(e) => e.stopPropagation()}
      onScroll={(e) => e.stopPropagation()}
    >
      <div className="py-2 w-80 max-h-96 overflow-auto">
        {BIO_TAGS.map((tag) => (
          <button
            key={tag.value}
            onClick={() => {
              onSelect(tag.value as BioTag);
              onClose();
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <span
              className={`font-mono text-sm font-medium px-1 py-0.5 h-min rounded border ${
                TAG_COLORS[tag.value]
              }`}
            >
              {tag.value}
            </span>
            <TextUI variant="normal" className="text-gray-700">
              {tag.label}
            </TextUI>
          </button>
        ))}
      </div>
    </div>
  );
}
