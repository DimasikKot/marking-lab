export const ButtonPage = ({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading?: boolean;
}) => {
  return (
    <div className="relative">
      <div className="absolute bg-white -left-18 rounded-3xl cursor-pointer select-none">
        <button onClick={onClick}>
          <div
            className="w-12 h-12 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 rounded-3xl
        flex items-center justify-center text-4xl text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="material-icons">arrow_back</span>
          </div>
        </button>

        {isLoading != undefined && (
          <div
            className="mt-4 w-12 h-12 border border-gray-200 rounded-3xl
          flex items-center justify-center text-4xl text-gray-700 transition-colors"
          >
            <span
              className={`material-icons ${isLoading ? "animate-spin" : ""}`}
            >
              {isLoading ? "refresh" : "done"}
            </span>
            {/* <span className="material-icons">task_alt</span> */}
          </div>
        )}
      </div>
    </div>
  );
};
