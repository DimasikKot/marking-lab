import io
import json
import tempfile
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from app.services.model import (
    Trainer,
    TrainingArguments,
    NERModel,
    build_zip_model,
    extract_labels_from_sentences,
    parse_csv_from_text,
    prepare_dataset,
)
from app.services.model_plots import loss_plot, plot_confusion_matrix

router = APIRouter()


@router.post("/train")
async def train_ner(
    parameters: str = Form(...),
    files: list[UploadFile] = File(...),
):
    params = json.loads(parameters)

    EPOCHS = int(params.get("Эпохи", 2))
    BATCH_SIZE = int(params.get("Размер батчей", 32))
    # distilbert-base-uncased
    BASE_MODEL = str(params.get("Базовая модель", "albert-base-v2"))
    LEARNING_RATE = float(params.get("Скорость обучения", 2e-5))
    TESTING_SIZE = float(params.get("Размер тренировочного набора", 0.2))
    MAX_LINE_LENGHT = int(params.get("Максимальная длина предложения", 128))

    # Собираем все предложения из загруженных CSV-файлов
    all_sentences = []
    for file in files:
        content = await file.read()
        text = content.decode("utf-8")
        # Теперь используем правильный парсер
        all_sentences.extend(parse_csv_from_text(text))  # список предложений

    if not all_sentences:  # если предложений нет
        return StreamingResponse(
            io.BytesIO(b"no data"),
            media_type="text/plain",
            status_code=400,
        )

    label_list = extract_labels_from_sentences(all_sentences)  # список уникальных меток

    # Разбиение train/validation (80/20)
    split_idx = int(len(all_sentences) * TESTING_SIZE)
    train_sentences = all_sentences[:split_idx]
    eval_sentences = all_sentences[split_idx:]

    ner = NERModel(BASE_MODEL, label_list)
    tokenizer = ner.tokenizer
    label2id = ner.label2id

    train_dataset = prepare_dataset(
        train_sentences, tokenizer, label2id, MAX_LINE_LENGHT
    )
    eval_dataset = (
        prepare_dataset(eval_sentences, tokenizer, label2id, MAX_LINE_LENGHT)
        if eval_sentences
        else None
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        result = ner.train(
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            output_dir=tmpdir,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            learning_rate=LEARNING_RATE,
        )

        eval_metrics = result["eval_metrics"]

        metrics = {}
        metrics_labels = {}

        # Метрики
        if eval_metrics:
            metrics = {
                "Точность (accuracy)": eval_metrics.get("eval_accuracy"),
                "Точность (precision)": eval_metrics.get("eval_precision"),
                "Полнота (recall)": eval_metrics.get("eval_recall"),
                "F1-мера": eval_metrics.get("eval_f1"),
            }

            # метрики по классам (если они есть в результате)
            for key, value in eval_metrics.items():
                # обычно классовые метрики идут как:
                # "eval_PER", "eval_ORG", "eval_LOC" и т.д.
                if key.startswith("eval_") and isinstance(value, dict):
                    label_name = key.replace("eval_", "")

                    metrics_labels[label_name] = {
                        "Точность": value.get("precision"),
                        "Полнота": value.get("recall"),
                        "F1-мера": value.get("f1"),
                    }

        print(metrics)
        print(metrics_labels)

        # ========== ВЫВОД ПРЕДСКАЗАНИЙ ==========
        predictions_output = []

        if eval_dataset and len(eval_sentences) > 0:
            # Получаем предсказания модели
            trainer = Trainer(
                model=ner.model,
                args=TrainingArguments(
                    output_dir=tmpdir,
                    per_device_eval_batch_size=BATCH_SIZE,
                    report_to="none",
                ),
                data_collator=ner.data_collator,
            )

            predictions = trainer.predict(eval_dataset)  # type: ignore
            preds = np.argmax(predictions.predictions, axis=2)

            # Декодируем предсказания для каждого примера
            for idx, (sentence, true_labels_original) in enumerate(zip(eval_sentences, predictions.label_ids)):  # type: ignore
                # Получаем исходные токены
                tokens = [item["token"] for item in sentence]
                true_labels = [item["label"] for item in sentence]

                # Получаем предсказанные метки для этого предложения
                # Нужно сопоставить с исходными токенами, учитывая субтокенизацию
                pred_labels_aligned = []

                # Токенизируем предложение с выравниванием
                tokenized = tokenizer(
                    tokens,
                    truncation=True,
                    is_split_into_words=True,
                    max_length=MAX_LINE_LENGHT,
                    return_tensors="pt",
                )

                word_ids = (
                    tokenized.word_ids()
                )  # список индексов слов для каждой позиции
                pred_ids_for_sentence = preds[
                    idx
                ]  # предсказания для каждой позиции (включая субтокены)
                # Выравниваем предсказания
                prev_word_idx = None
                pred_labels_aligned = []
                for i, word_idx in enumerate(word_ids):
                    if word_idx is None:
                        continue  # пропускаем [CLS] и [SEP]
                    if word_idx != prev_word_idx:
                        # Берем предсказание для ТЕКУЩЕЙ позиции i (первый субтокен)
                        if i < len(pred_ids_for_sentence):
                            pred_label = label_list[pred_ids_for_sentence[i]]
                            pred_labels_aligned.append(pred_label)
                        prev_word_idx = word_idx
                # Обрезаем до длины исходного предложения (на всякий случай)
                pred_labels_aligned = pred_labels_aligned[: len(tokens)]
                # Собираем результаты для этого предложения
                sentence_predictions = {
                    "sentence_id": idx,
                    "tokens": tokens,
                    "true_labels": true_labels,
                    "predicted_labels": pred_labels_aligned,
                }

                # Подсчет правильных/неправильных для этого предложения
                correct_count = sum(
                    1 for t, p in zip(true_labels, pred_labels_aligned) if t == p
                )
                total_count = len(tokens)
                sentence_predictions["accuracy"] = (
                    correct_count / total_count if total_count > 0 else 0
                )

                # Находим ошибки
                errors = []
                for token_idx, (token, true, pred) in enumerate(
                    zip(tokens, true_labels, pred_labels_aligned)
                ):
                    if true != pred:
                        errors.append(
                            {
                                "position": token_idx,
                                "token": token,
                                "true_label": true,
                                "predicted_label": pred,
                            }
                        )
                sentence_predictions["errors"] = errors

                predictions_output.append(sentence_predictions)

            # Общая статистика по предсказаниям
            total_correct = sum(
                p["accuracy"] * len(p["tokens"]) for p in predictions_output
            )
            total_tokens = sum(len(p["tokens"]) for p in predictions_output)
            overall_accuracy = total_correct / total_tokens if total_tokens > 0 else 0

            # Статистика по каждой метке
            label_stats = {}
            for pred_info in predictions_output:
                for true, pred in zip(
                    pred_info["true_labels"], pred_info["predicted_labels"]
                ):
                    if true not in label_stats:
                        label_stats[true] = {"total": 0, "correct": 0}
                    label_stats[true]["total"] += 1
                    if true == pred:
                        label_stats[true]["correct"] += 1

            # Добавляем статистику в метрики
            # metrics["predictions_stats"] = {
            #     "overall_token_accuracy": overall_accuracy,
            #     "total_sentences": len(predictions_output),
            #     "total_tokens": total_tokens,
            #     "label_wise_accuracy": {
            #         label: (
            #             stats["correct"] / stats["total"] if stats["total"] > 0 else 0
            #         )
            #         for label, stats in label_stats.items()
            #     },
            #     "first_5_examples": predictions_output[
            #         :5
            #     ],  # Только первые 5 примеров для ответа
            # }

            # Сохраняем полные предсказания в файл
            predictions_file = io.BytesIO()
            predictions_json = json.dumps(
                predictions_output, indent=2, ensure_ascii=False
            )
            predictions_file.write(predictions_json.encode("utf-8"))
            predictions_file.seek(0)

        train_loss_plot = loss_plot("Потери на обучении", result["train_loss"])
        # validation_loss_plot = loss_plot(
        #     "Потери на валидации", result["validation_loss"]
        # )
        # confusion_matrix_plot = plot_confusion_matrix(label_list)

        # Если есть предсказания, добавляем их в zip архив
        zip_data = build_zip_model(tmpdir)
        if predictions_output:
            import zipfile

            zip_buffer = io.BytesIO(zip_data)
            with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED) as zf:
                zf.writestr("predictions.json", predictions_json)
            zip_data = zip_buffer.getvalue()

        # zip_data = build_zip_model(tmpdir)
        # zip_data = io.BytesIO(zip_data)  # если zip_data это bytes
        # zip_data.seek(0, 2)  # в конец
        # file_size = zip_data.tell()
        # zip_data.seek(0)  # обратно в начало

        return {
            "parameters": json.dumps(parameters),
            "metrics": json.dumps(metrics),
            "graphs": json.dumps(
                {
                    "Потери на обучении": f"data:image/png;base64,{train_loss_plot}",
                    # "Потери на валидации": f"data:image/png;base64,{validation_loss_plot}",
                    # "Матрица ошибок": f"data:image/png;base64,{confusion_matrix_plot}",
                }
            ),
        }
