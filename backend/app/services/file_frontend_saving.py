from pathlib import Path

from app.services.file import Row


def write_page_to_file(
    file_path: Path,
    page: int,
    rows_per_page: int,
    new_rows: list[Row],
) -> int:
    """
    Перезаписывает только указанную страницу в файле.
    Возвращает новое общее количество строк после обновления.
    """
    if not file_path.exists():
        # Если файл вдруг исчез — создаём новый
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with file_path.open("w", encoding="utf-8", newline="") as f:
            f.write("tokens,labels\n")  # заголовок

    # Читаем весь файл в память (для большинства BIO-файлов это нормально)
    lines = file_path.read_text(encoding="utf-8", errors="ignore").splitlines(
        keepends=True
    )

    # Гарантируем наличие заголовка
    if not lines or not lines[0].strip().startswith("tokens"):
        lines.insert(0, "tokens,labels\n")

    start_idx = (page - 1) * rows_per_page + 1  # +1 потому что есть заголовок
    end_idx = start_idx + rows_per_page

    # Подготавливаем новые строки в CSV-формате
    new_lines: list[str] = []
    for row in new_rows:
        tokens = " ".join(w.token for w in row.words)
        labels = " ".join(w.label for w in row.words)
        # Экранируем кавычками — надёжно даже если в токенах есть запятые/кавычки
        new_lines.append(f'"{tokens}","{labels}"\n')

    # Заменяем/добавляем строки
    if start_idx < len(lines):
        # Заменяем существующие строки
        lines[start_idx:end_idx] = new_lines
    else:
        # Добавляем в конец (если страница дальше текущего размера)
        lines.extend(new_lines)

    # Перезаписываем файл целиком
    file_path.write_text("".join(lines), encoding="utf-8")

    # Вычисляем новое общее количество строк (без заголовка)
    new_total_rows = len(lines) - 1
    return new_total_rows
