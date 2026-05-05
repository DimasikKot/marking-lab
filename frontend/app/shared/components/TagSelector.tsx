import {
  BIO_TAGS,
  TAG_COLORS,
  type BioTag,
  type NextBioTag,
} from "@/shared/constants/tags";
import { TextUI } from "./TextUI";

type Props = {
  onSelect: (tag: BioTag | NextBioTag) => void;
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
      <div className="py-2 w-80 h-96 overflow-auto">
        {BIO_TAGS.map((tag) => (
          <div key={tag.value} className="px-2 py-2.5 gap-2 flex flex-row">
            <button
              onClick={() => {
                onSelect(tag.value as BioTag);
                onClose();
              }}
              className="p-1 w-full text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <span
                className={`font-mono text-sm font-medium px-1 py-0.5 w-14 h-min text-center rounded ${
                  TAG_COLORS[tag.value]
                }`}
              >
                {tag.value}
              </span>

              <TextUI variant="normal">{tag.label}</TextUI>
            </button>

            {tag.value_next && (
              <button
                key={tag.value_next}
                onClick={() => {
                  onSelect(tag.value_next as NextBioTag);
                  onClose();
                }}
                className="px-1 w-min text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <span
                  className={`font-mono text-sm font-medium px-1 py-0.5 w-13 text-center rounded ${
                    TAG_COLORS[tag.value_next]
                  }`}
                >
                  {tag.value_next}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
