import csv
import io
import tempfile
import time
import zipfile
import httpx
import numpy as np
from transformers import Trainer, TrainingArguments

from app.core.config import settings
from app.services.model_class import NERModel
from app.services.model_files import parse_csv_from_text, prepare_dataset


def model_predict(
    project_id: int,
    model_id: int,
    uuid: str,
    ner: NERModel,
    MAX_LINE_LENGTH: int,
    BATCH_SIZE: int,
) -> float:
    with httpx.Client(timeout=300) as client:
        response = client.get(
            f"{settings.BACKEND_URL}/projects/{project_id}/models/{model_id}/prediction_files",
            params={"uuid": uuid},
        )

        response.raise_for_status()

        zip_bytes = io.BytesIO(response.content)

        url = f"{settings.BACKEND_URL}/projects/{project_id}/models/{model_id}/progress"

        client.post(
            url,
            json={
                "uuid": uuid,
                "progress": 91,
            },
        )

        # Сохраняем модель во временном каталоге, чтобы не засорять память
        with tempfile.TemporaryDirectory() as tmpdir:
            start_time = time.perf_counter()
            trainer = Trainer(
                model=ner.model,
                args=TrainingArguments(
                    output_dir=tmpdir,
                    per_device_eval_batch_size=BATCH_SIZE,
                    report_to="none",
                ),
                data_collator=ner.data_collator,
            )
            prediction_load_time_seconds = time.perf_counter() - start_time

            with zipfile.ZipFile(zip_bytes) as zip_file:
                for index, file_name in enumerate(zip_file.namelist()):
                    with zip_file.open(file_name) as file:
                        client.post(
                            url,
                            json={
                                "uuid": uuid,
                                "progress": int((index / len(zip_file.namelist())) * 7)
                                + 92,
                            },
                        )

                        text = file.read().decode("utf-8")

                        # Разбиваем текст
                        validation_sentences = parse_csv_from_text(text)

                        # Dataset для модели
                        dataset = prepare_dataset(
                            tokenizer=ner.tokenizer,
                            label2id=ner.label2id,
                            max_length=MAX_LINE_LENGTH,
                            sentences=validation_sentences,
                        )

                        predictions = trainer.predict(dataset)  # type: ignore
                        preds = np.argmax(predictions.predictions, axis=2)
                        result_rows = []
                        for idx, sentence in enumerate(validation_sentences):
                            tokens = [item["token"] for item in sentence]
                            tokenized = ner.tokenizer(
                                tokens,
                                truncation=True,
                                is_split_into_words=True,
                                max_length=MAX_LINE_LENGTH,
                                return_tensors="pt",
                            )
                            word_ids = tokenized.word_ids()
                            pred_ids_for_sentence = preds[idx]
                            prev_word_idx = None
                            pred_labels_aligned = []

                            for i, word_idx in enumerate(word_ids):
                                if word_idx is None:
                                    continue
                                if word_idx != prev_word_idx:
                                    if i < len(pred_ids_for_sentence):
                                        pred_label = ner.label_list[
                                            pred_ids_for_sentence[i]
                                        ]
                                        pred_labels_aligned.append(pred_label)
                                    prev_word_idx = word_idx
                            pred_labels_aligned = pred_labels_aligned[: len(tokens)]
                            result_rows.append(
                                {
                                    "tokens": tokens,
                                    "labels": pred_labels_aligned,
                                }
                            )

                        # Сохранение CSV
                        # result_path = (
                        #     Path("./files") / f"{Path(file_name).stem}_pred.csv"
                        # )
                        # result_path.parent.mkdir(parents=True, exist_ok=True)
                        # with result_path.open(
                        #     "w",
                        #     encoding="utf-8",
                        #     newline="",
                        # ) as f:
                        #     writer = csv.writer(f)
                        #     writer.writerow(["text", "labels"])
                        #     for item in result_rows:
                        #         text_part = " ".join(item["tokens"])
                        #         labels_part = " ".join(item["labels"])
                        #         writer.writerow([text_part, labels_part])

                        # Создаём CSV в памяти
                        csv_buffer = io.StringIO()

                        writer = csv.writer(csv_buffer)
                        writer.writerow(["text", "labels"])

                        for item in result_rows:
                            text_part = " ".join(item["tokens"])
                            labels_part = " ".join(item["labels"])
                            writer.writerow([text_part, labels_part])

                        # Переводим в bytes
                        csv_bytes = csv_buffer.getvalue().encode("utf-8")

                        url = f"http://backend:8000/api/v1/projects/{project_id}/models/{model_id}/prediction_files"

                        response = client.post(
                            url,
                            data={
                                "uuid": uuid,
                                "name": f"model-{model_id} file-{file_name} prediction.csv",
                            },
                            files={
                                "file": (
                                    f"model-{model_id} file-{file_name} prediction.csv",
                                    csv_bytes,
                                    "text/csv",
                                )
                            },
                            timeout=60.0,
                        )

                        # print(response.status_code)
                        # print(response.json())
    return prediction_load_time_seconds
