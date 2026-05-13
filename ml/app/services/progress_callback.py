import httpx
from transformers import TrainerCallback

from app.core.config import settings


class ProgressCallback(TrainerCallback):
    def __init__(
        self,
        train_access_token: str,
        total_epochs: int,
    ):
        self.train_access_token = train_access_token
        self.total_epochs = total_epochs

        self.last_progress = -1

    def _send_progress(self, progress: int, metrics: dict):
        try:
            metrics_data = {
                "F1-мера": metrics.get("f1"),
                "Потери на обучающей выборке": metrics.get("train_loss"),
                "Потери на валидационной выборке": metrics.get("eval_loss"),
                "Полнота (recall)": metrics.get("recall"),
                "Скорость обучения": metrics.get("learning_rate"),
                "Точность (accuracy)": metrics.get("accuracy"),
                "Точность (precision)": metrics.get("precision"),
            }

            if "epoch" in metrics:
                metrics_data["Эпоха"] = f'{metrics["epoch"]} / {self.total_epochs}'

            metrics_data = {k: v for k, v in metrics_data.items() if v is not None}

            request = {
                "train_access_token": self.train_access_token,
                "progress": progress,
                "metrics": metrics_data,
            }

            print("=" * 100)
            print(request)
            print("=" * 100)

            response = httpx.post(settings.PROGRESS_URL, json=request, timeout=300)

            if response.status_code != 200:
                print(f"Ошибка отправки прогресса: {response}")
                raise RuntimeError(f"Не удалось отправить прогресс")

            return True

        except Exception as _:
            return False

    def _calculate_progress(self, state):
        """
        Прогресс по step, а не по epoch.
        """

        if state.max_steps and state.max_steps > 0:
            progress = int((state.global_step / state.max_steps) * 80) + 10
        else:
            progress = 0

        return min(progress, 95)

    def on_log(self, args, state, control, logs=None, **kwargs):
        """
        Вызывается постоянно во время train.
        """

        if not logs:
            return control

        progress = self._calculate_progress(state)

        # не спамим одинаковый progress
        if progress == self.last_progress:
            return control

        self.last_progress = progress

        metrics = {}

        # TRAIN METRICS
        if "loss" in logs:
            metrics["train_loss"] = float(logs["loss"])

        if "learning_rate" in logs:
            metrics["learning_rate"] = float(logs["learning_rate"])

        if "epoch" in logs:
            metrics["epoch"] = float(logs["epoch"])

        # print("^" * 100)
        # print("ON LOG")
        # print(logs)
        # print("^" * 100)

        success = self._send_progress(
            progress=progress,
            metrics=metrics,
        )

        if not success:
            print(f"Ошибка отправки прогресса, остановка модели")
            raise RuntimeError(f"Не удалось отправить прогресс")

        return control

    def on_evaluate(self, args, state, control, metrics=None, **kwargs):
        if not metrics:
            return

        progress = self._calculate_progress(state)

        eval_metrics = {}

        if "eval_loss" in metrics:
            eval_metrics["eval_loss"] = float(metrics["eval_loss"])

        if "eval_accuracy" in metrics:
            eval_metrics["accuracy"] = float(metrics["eval_accuracy"])

        if "eval_precision" in metrics:
            eval_metrics["precision"] = float(metrics["eval_precision"])

        if "eval_recall" in metrics:
            eval_metrics["recall"] = float(metrics["eval_recall"])

        if "eval_f1" in metrics:
            eval_metrics["f1"] = float(metrics["eval_f1"])

        # print("^" * 100)
        # print("ON EVALUATE")
        # print(metrics)
        # print("^" * 100)

        self._send_progress(
            progress=progress,
            metrics=eval_metrics,
        )

    # def on_train_end(self, args, state, control, **kwargs):
    #     self._send_progress(
    #         progress=100,
    #         metrics={"status": "completed"},
    #     )
