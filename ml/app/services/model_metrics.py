import io
import base64
import matplotlib.pyplot as plt
import numpy as np
from typing import Any, cast
from seqeval.metrics import classification_report, f1_score, accuracy_score
from seqeval.scheme import IOB2


# Метрики
def compute_metrics(p, label_list):
    predictions, labels = p
    predictions = np.argmax(predictions, axis=2)

    true_predictions = [
        [label_list[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [label_list[l] for (_, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]

    # Сохраняем метки в глобальную переменную или атрибут trainer
    # Самый простой способ - вернуть их вместе с метриками
    report = classification_report(
        true_labels,
        true_predictions,
        scheme=IOB2,
        output_dict=True,
    )
    report_dict = cast(dict[str, Any], report)
    f1 = f1_score(true_labels, true_predictions, scheme=IOB2)
    acc = accuracy_score(true_labels, true_predictions)

    # Возвращаем метрики И метки
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": report_dict["micro avg"]["precision"],
        "recall": report_dict["micro avg"]["recall"],
        "true_labels": true_labels,  # добавляем
        "pred_labels": true_predictions,  # добавляем
    }


# График потерь
def loss_plot(title: str, loss_list: list) -> tuple[str, str | None]:
    fig, ax = plt.subplots(figsize=(6, 4))
    comment = None

    if loss_list:
        epochs = [item[0] for item in loss_list if item[0] is not None]
        losses = [item[1] for item in loss_list if item[0] is not None]

        if epochs:
            ax.plot(epochs, losses, "b-o", linewidth=1, markersize=4)

            # Анализ
            min_loss = min(losses)
            min_epoch = epochs[losses.index(min_loss)]

            if losses[-1] < losses[0]:
                trend = "В целом наблюдается снижение функции потерь."
            else:
                trend = "Функция потерь не имеет выраженной тенденции к снижению."

            comment = (
                f"Минимальные потери ({min_loss:.4f}) достигнуты на эпохе {min_epoch}.\n"
                f"{trend}"
            )

    ax.set_title(title)
    ax.set_xlabel("Эпохи")
    ax.set_ylabel("Потери")
    ax.grid(True, alpha=0.3)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)

    return base64.b64encode(buf.getvalue()).decode("utf-8"), comment


# График матрицы ошибок
def plot_confusion_matrix(
    label_list: list[str], true_labels: list, pred_labels: list
) -> tuple[str, str | None]:
    # Фильтруем метки, исключая "O"
    labels = [l for l in label_list if l != "O"]
    size = len(labels)

    if size == 0:
        # Создаем пустой график, если нет меток
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.text(
            0.5, 0.5, "Нет меток для отображения", ha="center", va="center", fontsize=14
        )
        ax.set_title("Матрица ошибок")
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
        plt.close(fig)
        return base64.b64encode(buf.getvalue()).decode("utf-8"), None

    # Создаем mapping меток в индексы
    # label_to_idx = {label: idx for idx, label in enumerate(labels)}

    # Фильтруем предсказания, исключая "O"
    filtered_true = []
    filtered_pred = []
    for true, pred in zip(true_labels, pred_labels):
        if true != "O" and pred != "O":
            filtered_true.append(true)
            filtered_pred.append(pred)

    # Строим матрицу ошибок
    from sklearn.metrics import confusion_matrix

    cm = confusion_matrix(filtered_true, filtered_pred, labels=labels)

    # Анализ
    correct_per_class = np.diag(cm)
    total_per_class = cm.sum(axis=1)

    accuracy_per_class = np.divide(
        correct_per_class,
        total_per_class,
        out=np.zeros_like(correct_per_class, dtype=float),
        where=total_per_class != 0,
    )

    best_idx = np.argmax(accuracy_per_class)
    worst_idx = np.argmin(accuracy_per_class)

    comment = (
        f"Лучше всего распознаётся класс «{labels[best_idx]}»\n"
        f"(доля верных предсказаний {accuracy_per_class[best_idx]:.2%}).\n\n"
        f"Хуже всего распознаётся класс «{labels[worst_idx]}»\n"
        f"(доля верных предсказаний {accuracy_per_class[worst_idx]:.2%})."
    )

    # Визуализация
    fig, ax = plt.subplots(figsize=(10, 8))

    # Отображаем матрицу
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    plt.colorbar(im, ax=ax)

    # Настраиваем оси
    ax.set_xticks(np.arange(size))
    ax.set_yticks(np.arange(size))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_yticklabels(labels)

    # Добавляем значения в ячейки
    for i in range(size):
        for j in range(size):
            ax.text(
                j,
                i,
                cm[i, j],
                ha="center",
                va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black",
            )

    ax.set_xlabel("Предсказанные метки")
    ax.set_ylabel("Истинные метки")
    ax.set_title(f"Матрица ошибок (всего: {len(filtered_true)} примеров)")

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    plt.close(fig)

    return base64.b64encode(buf.getvalue()).decode("utf-8"), comment
