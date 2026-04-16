export const ButtonBack = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="absolute bg-white -left-18 rounded-3xl transition-all hover:scale-105 active:scale-95"
      >
        <div className="w-12 h-12 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 rounded-3xl flex items-center justify-center text-4xl text-gray-700 hover:text-gray-900 transition-colors">
          <span className="material-icons">arrow_back</span>
        </div>
      </button>
    </div>
  );
};
