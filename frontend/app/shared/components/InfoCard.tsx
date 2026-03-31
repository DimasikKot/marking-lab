export function InfoCard({
  icon,
  iconBgClass,
  iconTextClass,
  title,
  description,
}: {
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="w-80 shrink-0">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all hover:-rotate-1 active:rotate-1 h-full">
        {/* Иконка */}
        <div
          className={`w-12 h-12 ${iconBgClass} ${iconTextClass} rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto`}
        >
          <span className="material-icons text-[28px]">{icon}</span>
        </div>

        {/* Заголовок */}
        <h4 className="text-2xl font-semibold text-center mb-4">{title}</h4>

        {/* Описание */}
        <p className="text-gray-600 text-center leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
