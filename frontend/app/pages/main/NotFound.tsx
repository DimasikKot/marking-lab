import { ButtonUI } from "@/shared/components/ButtonUI";
import { Header } from "@/shared/components/Header";

export function NotFound() {
  return (
    <>
      <Header title="Страница не найдена" />

      <div className="max-w-6xl mx-auto m-2 items-center flex flex-col">
        <ButtonUI onClick={() => (window.location.href = "/")}>
          На главную
        </ButtonUI>
      </div>
    </>
  );
}
