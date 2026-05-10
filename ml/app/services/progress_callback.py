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

    def _send_progress(self, progress: int, metrics: dict):
        try:
            url = f"http://backend:8000/api/v1/projects/{self.project_id}/models/{self.model_id}/progress"
            request = {
                "uuid": self.uuid,
                "progress": progress,
            }

            if metrics != {}:
                request["metrics"] = json.dumps(metrics)
            print("=" * 100)
            print(request, metrics)
            print("=" * 100)

            with httpx.Client() as client:
                try:
                    client.post(url, json=request)
                except Exception as event:
                    with httpx.Client() as client:
                        client.post(url, json={"progress": 0})
                    raise RuntimeError(f"Ошибка отправки прогресса: {event}") from event

        except Exception as event:
            with httpx.Client() as client:
                client.post(url, json={"progress": 0})
            raise RuntimeError(f"Ошибка отправки прогресса: {event}") from event

    def on_epoch_end(self, args, state, control, logs=None, **kwargs):
        current_epoch = int(state.epoch or 0)

        progress = int((current_epoch / self.total_epochs) * 90 + 5)

        metrics = {}

        print("^" * 100)
        print(logs)
        print("^" * 100)

        if logs:
            if "loss" in logs:
                metrics["train_loss"] = logs["loss"]

            if "eval_loss" in logs:
                metrics["eval_loss"] = logs["eval_loss"]

            if "eval_accuracy" in logs:
                metrics["accuracy"] = logs["eval_accuracy"]

            if "eval_precision" in logs:
                metrics["precision"] = logs["eval_precision"]

            if "eval_recall" in logs:
                metrics["recall"] = logs["eval_recall"]

            if "eval_f1" in logs:
                metrics["f1"] = logs["eval_f1"]

        self._send_progress(
            progress=progress,
            metrics=metrics,
        )
