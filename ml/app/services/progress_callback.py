import json
import httpx

from transformers import TrainerCallback


class ProgressCallback(TrainerCallback):
    def __init__(
        self,
        project_id: int,
        model_id: int,
        uuid: str,
        total_epochs: int,
    ):
        self.project_id = project_id
        self.model_id = model_id
        self.uuid = uuid
        self.total_epochs = total_epochs

        self.last_progress = -1

    def _send_progress(self, progress: int, metrics: dict | None = None):
        try:
            url = (
                f"http://backend:8000/api/v1/projects/"
                f"{self.project_id}/models/{self.model_id}/progress"
            )

            request = {
                "uuid": self.uuid,
                "progress": progress,
            }

            if metrics:
                request["metrics"] = metrics

            print("=" * 100)
            print(request)
            print("=" * 100)

            with httpx.Client(timeout=5.0) as client:
                client.post(url, json=request)

        except Exception as event:
            print(f"Ошибка отправки прогресса: {event}")

    def _calculate_progress(self, state):
        """
        Прогресс по step, а не по epoch.
        """

        if state.max_steps and state.max_steps > 0:
            progress = int((state.global_step / state.max_steps) * 90) + 5
        else:
            progress = 0

        return min(progress, 95)

    def on_log(self, args, state, control, logs=None, **kwargs):
        """
        Вызывается постоянно во время train.
        """

        if not logs:
            return

        progress = self._calculate_progress(state)

        # не спамим одинаковый progress
        if progress == self.last_progress:
            return

        self.last_progress = progress

        metrics = {}

        # TRAIN METRICS
        if "loss" in logs:
            metrics["train_loss"] = float(logs["loss"])

        if "learning_rate" in logs:
            metrics["learning_rate"] = float(logs["learning_rate"])

        if "epoch" in logs:
            metrics["epoch"] = float(logs["epoch"])

        print("^" * 100)
        print("ON LOG")
        print(logs)
        print("^" * 100)

        self._send_progress(
            progress=progress,
            metrics=metrics,
        )

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

        print("^" * 100)
        print("ON EVALUATE")
        print(metrics)
        print("^" * 100)

        self._send_progress(
            progress=progress,
            metrics=eval_metrics,
        )

    def on_train_end(self, args, state, control, **kwargs):
        self._send_progress(
            progress=100,
            metrics={"status": "completed"},
        )
