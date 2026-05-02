import { BIO_TAGS, type BioTag } from "@/shared/constants/tags";
import { TextUI } from "./TextUI";

type Props = {
  onSelect: (tag: BioTag) => void;
  onClose: () => void;
  position?: { x: number; y: number };
};

export function TagSelector({ onSelect, onClose, position }: Props) {
  return (
    <div
      className="fixed bg-white shadow-2xl border border-gray-200 rounded-2xl py-2 z-50 max-h-96 overflow-auto"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {BIO_TAGS.map((tag) => (
        <button
          key={tag.value}
          onClick={() => {
            onSelect(tag.value as BioTag);
            onClose();
          }}
          className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
        >
          <span className="font-mono text-sm font-medium text-blue-600 w-16">
            {tag.value}
          </span>
          <TextUI variant="normal" className="text-gray-700">
            {tag.label}
          </TextUI>
        </button>
      ))}
    </div>
  );
}