import { Header } from "@/shared/components/Header";

export function NotFound() {
  return (
    <div>
      <Header>Страница не найдена</Header>

      <div className="max-w-6xl mx-auto m-6">
        <p>Страница не найдена</p>
      </div>
    </div>
  );
}
