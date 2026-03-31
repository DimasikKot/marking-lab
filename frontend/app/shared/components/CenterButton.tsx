export function CenterButton({
  icon,
  title,
  description,
  ctaText,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  ctaText: string;
  onClick: () => void;
}) {
  return (
    <div className="w-105 shrink-0 flex items-center justify-center">
      <button
        onClick={onClick}
        className="group relative flex flex-col 
        items-center justify-center gap-6 px-16 py-14 
        bg-neutral-600 hover:bg-neutral-700 text-white rounded-3xl 
        border border-zinc-700 shadow-2xl hover:shadow-3xl 
        transition-all duration-300 hover:-translate-y-1 active:scale-95"
      >
        {/* Градиентный оверлей при наведении */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Иконка */}
        <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
          <span className="material-icons text-36 text-white">{icon}</span>
        </div>

        {/* Текстовая часть */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-zinc-400 max-w-xs">{description}</p>
        </div>

        {/* Внутренняя кнопка-CTA */}
        <div
          className="mt-4 px-10 py-3.5 bg-white text-zinc-900 rounded-2xl font-medium flex items-center gap-3 
                        group-hover:bg-zinc-100 transition-colors shadow-md"
        >
          {ctaText}
          <span className="text-xl group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </button>
    </div>
  );
}
