import io
import json
from pathlib import Path
import zipfile
import httpx

from app.services.model_class import NERModel


def model_predict(project_id: int, model_id: int, uuid: str, ner: NERModel):
    SERVER_URL = "http://backend:8000/api/v1"

    with httpx.Client(timeout=300) as client:

        response = client.get(
            f"{SERVER_URL}/projects/{project_id}/models/{model_id}/prediction_files",
            params={"uuid": uuid},
        )

        response.raise_for_status()

        zip_bytes = io.BytesIO(response.content)

        with zipfile.ZipFile(zip_bytes) as zip_file:
            for file_name in zip_file.namelist():
                with zip_file.open(file_name) as file:
                    text = file.read().decode("utf-8")

                    predictions = ner.predict(text)

                    result_path = (
                        Path("./models")
                        / str(model_id)
                        / f"{Path(file_name).stem}_predictions.json"
                    )

                    result_path.parent.mkdir(
                        parents=True,
                        exist_ok=True,
                    )

                    result_path.write_text(
                        json.dumps(
                            predictions,
                            ensure_ascii=False,
                            indent=2,
                        ),
                        encoding="utf-8",
                    )
