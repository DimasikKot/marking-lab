export const Checkbox = ({
  selectedFileIsLabeled,
  onClick,
  title,
  className,
}: {
  selectedFileIsLabeled: boolean;
  onClick: () => void;
  title?: string;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      // flex и items-center выравнивают иконку и текст в одну линию
      className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors ${className}`}
    >
      {/* Иконка из библиотеки Material Icons */}
      <span
        className={`material-icons ${selectedFileIsLabeled ? "text-blue-600" : "text-gray-400"}`}
      >
        {selectedFileIsLabeled ? "check_box" : "check_box_outline_blank"}
      </span>

      {/* Текст кнопки */}
      {title && (
        <span className="text-sm font-medium text-gray-700">{title}</span>
      )}
    </button>
  );
};
