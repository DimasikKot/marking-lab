import { useNavigate } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { InfoCard } from "@/shared/components/InfoCard";
import { BigInfoCard } from "@/shared/components/BigInfoCard";
import { Text } from "@/shared/components/Text";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header>Главная</Header>

      {/* Центральная область */}
      <div className="flex-1 flex justify-center">
        <div className="max-w-6xl w-full flex gap-8 px-4 items-center">
          {/* Левая карточка */}
          <InfoCard
            icon="rocket_launch"
            iconClassName="bg-emerald-100 text-emerald-600"
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
            iconClassName="bg-blue-100 text-blue-600"
            title="Мы предлагаем"
            description="Удобную платформу для разметки и работы с данными."
          />
        </div>
      </div>

      {/* Футер */}
      <div className="text-center py-6">
        <Text variant="desc">Лаборатория разметки © 2026</Text>
      </div>
    </div>
  );
}
