import { useNavigate } from "react-router-dom";
import { Header } from "@/shared/components/Header";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { InfoCard } from "@/shared/components/InfoCard";
import { BigInfoCard } from "@/shared/components/BigInfoCard";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col overflow-auto">
      <Header>
        <h1 className="text-2xl font-bold">Главная</h1>
      </Header>

      <div className="flex justify-center p-4">
        <PrimaryButton onClick={() => navigate("/projects")}>
          Страница проектов
        </PrimaryButton>
      </div>

      {/* левая карточка + центр + правая карточка */}
      <div className="flex-1 flex items-start justify-center gap-8 pt-8">
        {/* Левая карточка — Наши плюсы */}
        <InfoCard
          icon="rocket_launch"
          iconBgClass="bg-emerald-100"
          iconTextClass="text-emerald-600"
          title="Наши плюсы"
          description="Современные инструменты разметки, высокая точность и удобный интерфейс для каждого пользователя."
        />

        {/* Центральная */}
        <BigInfoCard
          icon="auto_awesome"
          title="Создать новый проект"
          description="Начните работать с данными уже сегодня!"
          ctaText="Перейти к проектам"
          onClick={() => navigate("/projects")}
        />

        {/* Правая карточка */}
        <InfoCard
          icon="bolt"
          iconBgClass="bg-blue-100"
          iconTextClass="text-blue-600"
          title="Мы предлагаем"
          description="Удобную платформу для разметки и работы с данными."
        />
      </div>

      {/* Нижняя надпись */}
      <div className="text-center mt-12">
        <p className="text-xs text-gray-400">Лаборатория разметки © 2026</p>
      </div>
    </div>
  );
}
