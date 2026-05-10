import io
import base64
import matplotlib.pyplot as plt
import numpy as np
from typing import Any, cast
from seqeval.metrics import classification_report, f1_score, accuracy_score
from seqeval.scheme import IOB2


# Метрики
def compute_metrics(p, label_list):
    predictions, labels = p  # предсказанные метки и истинные метки
    predictions = np.argmax(
        predictions, axis=2
    )  # для каждого токена определяем индекс метки, по вероятности пренадлежности к классу

    true_predictions = [  # буквально X для модели
        [label_list[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]  # убираем элементы со значениями -100, преобразуем индексы меток в предсказанные метки
    true_labels = [  # буквально Y для модели
        [label_list[l] for (_, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]  # убираем элементы со значениями -100, преобразуем индексы меток в истинные метки
    # true_predictions (X) -> true_labels (Y)
    report = classification_report(
        true_labels,  # истинные метки
        true_predictions,  # предсказанные метки
        scheme=IOB2,  # схема разметки
        output_dict=True,  # вернуть словарём
    )
    report_dict = cast(dict[str, Any], report)
    f1 = f1_score(true_labels, true_predictions, scheme=IOB2)
    acc = accuracy_score(true_labels, true_predictions)
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": report_dict["micro avg"]["precision"],
        "recall": report_dict["micro avg"]["recall"],
    }


# График потерь
def loss_plot(title: str, loss_list: list) -> str:
    fig, ax = plt.subplots(figsize=(6, 4))
    if loss_list:
        epochs = [item[0] for item in loss_list if item[0] is not None]
        losses = [item[1] for item in loss_list if item[0] is not None]
        if epochs:
            ax.plot(epochs, losses, "b-o", linewidth=2, markersize=8)
    ax.set_title(title)
    ax.set_xlabel("Эпохи")
    ax.set_ylabel("Потери")
    ax.grid(True, alpha=0.3)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# График матрицы ошибок
def plot_confusion_matrix(label_list: list[str]) -> str:
    fig, ax = plt.subplots(figsize=(8, 6))
    labels = [l for l in label_list if l != "O"]
    size = len(labels)
    data = np.random.rand(size, size)  # заглушка, замените на реальную матрицу
    if size > 0:
        im = ax.imshow(data, cmap="hot", interpolation="nearest")
        ax.set_xticks(range(size))
        ax.set_yticks(range(size))
        ax.set_xticklabels(labels, rotation=45)
        ax.set_yticklabels(labels)
        plt.colorbar(im, ax=ax)
    ax.set_title("Матрица ошибок")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=80, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")
