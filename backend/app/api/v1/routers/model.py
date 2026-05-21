from datetime import datetime
import tempfile
from typing import Any
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from app.api.v1.routers.echo import GetEchoResponse
from app.api.v1.routers.file import FileDbResponse
from app.models.db import ModelDB
from app.services.user import get_user_id
from app.core.database import get_db
from app.services.model import (
    SortType,
    create_model,
    delete_model_by_id,
    fetch_model_db_by_id,
    fetch_models_db_by_project_id,
    train_model_by_id,
    stop_train_model_by_id,
    update_model_db_by_id,
)

router = APIRouter()


class ModelListResponse(BaseModel):
    id: int
    name: str
    progress: int
    parameters: dict[str, Any]
    metrics: dict[str, Any]

    training_files: list[FileDbResponse]
    prediction_files: list[FileDbResponse]
    predicted_files: list[FileDbResponse]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def ToModelListResponse(model_db: ModelDB) -> ModelListResponse:
    training_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "training" and link.file is not None
    ]

    prediction_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "for_prediction" and link.file is not None
    ]

    predicted_files = [
        FileDbResponse.model_validate(link.file)
        for link in model_db.file_links
        if link.role == "predicted" and link.file is not None
    ]

    return ModelListResponse(
        id=model_db.id,
        name=model_db.name,
        progress=model_db.progress,
        parameters=model_db.parameters,
        metrics=model_db.metrics,
        training_files=training_files,
        prediction_files=prediction_files,
        predicted_files=predicted_files,
        created_at=model_db.created_at,
        updated_at=model_db.updated_at,
    )


class ModelFullResponse(ModelListResponse):
    graphs: dict[str, str]

    class Config:
        from_attributes = True


def ToModelFullResponse(model_db: ModelDB) -> ModelFullResponse:
    model_list_response = ToModelListResponse(model_db)

    return ModelFullResponse(
        id=model_list_response.id,
        name=model_list_response.name,
        progress=model_list_response.progress,
        parameters=model_list_response.parameters,
        metrics=model_list_response.metrics,
        graphs=model_db.graphs,
        training_files=model_list_response.training_files,
        prediction_files=model_list_response.prediction_files,
        predicted_files=model_list_response.predicted_files,
        created_at=model_list_response.created_at,
        updated_at=model_list_response.updated_at,
    )


class PostModelRequest(BaseModel):
    name: str
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise HTTPException(
                status_code=400,
                detail="Название модели не должно превышать 255 символов",
            )
        return v

    @field_validator("training_files_ids")
    def validate_training_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 тренировочных файлов")
        return v

    @field_validator("prediction_files_ids")
    def validate_prediction_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 файлов, которые будут размечены")
        return v


@router.post("", response_model=ModelListResponse)
async def post(
    project_id: int,
    data: PostModelRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = create_model(
        project_id=project_id,
        user_id=user_id,
        db=db,
        name=data.name,
        parameters=data.parameters,
        training_files_ids=data.training_files_ids,
        prediction_files_ids=data.prediction_files_ids,
    )

    return ToModelListResponse(model_db=model_db)


class GetModelsResponse(BaseModel):
    data: list[ModelListResponse]


@router.get("", response_model=GetModelsResponse)
async def get(
    project_id: int,
    sort: SortType | None = Query(
        "created_at_desc",
        description="Сортировка: name_asc, name_desc, created_at_asc, created_at_desc, updated_at_asc, updated_at_desc",
    ),
    search: str | None = Query(None, description="Поиск по имени модели"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
) -> GetModelsResponse:
    models_db = fetch_models_db_by_project_id(
        project_id=project_id, user_id=user_id, db=db, sort=sort, search=search
    )

    return GetModelsResponse(
        data=[ToModelListResponse(model_db=model_db) for model_db in models_db]
    )


@router.get("/{model_id}", response_model=ModelFullResponse)
async def get_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    return ToModelFullResponse(model_db=model_db)


class PatchModelFullRequest(BaseModel):
    name: str | None = None
    parameters: dict[str, Any] | None = None
    training_files_ids: list[int] | None = None
    prediction_files_ids: list[int] | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise ValueError("Название модели не должно превышать 255 символов")
        return v

    @field_validator("training_files_ids")
    def validate_training_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 тренировочных файлов")
        return v

    @field_validator("prediction_files_ids")
    def validate_prediction_files_ids(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError("Максимум 5 файлов, которые будут размечены")
        return v


@router.patch("/{model_id}", response_model=ModelFullResponse)
async def patch_by_id(
    project_id: int,
    model_id: int,
    data: PatchModelFullRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = update_model_db_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
        name=data.name,
        parameters=data.parameters,
        training_files_ids=data.training_files_ids,
        prediction_files_ids=data.prediction_files_ids,
    )

    return ToModelFullResponse(model_db=model_db)


@router.get("/{model_id}/train", response_model=ModelFullResponse)
async def get_by_id_train(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = await train_model_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
    )

    return ToModelFullResponse(model_db=model_db)


@router.get("/{model_id}/download")
def download_model(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    with tempfile.NamedTemporaryFile(mode="w+b", delete=False) as tmp:
        tmp.write(b"""
# ========================= model_class.py =========================

import gc
from typing import Union
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
)

from app.core.config import settings
from app.services.model_metrics import compute_metrics
from app.services.progress_callback import ProgressCallback

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class NERModel:
    def __init__(self, model_name: str, label_list: list[str]):
        self.model_name = model_name
        self.label_list = label_list
        self.label2id = {l: i for i, l in enumerate(label_list)}
        self.id2label = {i: l for l, i in self.label2id.items()}

        self.tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
        self.model = AutoModelForTokenClassification.from_pretrained(
            model_name,
            num_labels=len(label_list),
            id2label=self.id2label,
            label2id=self.label2id,
        ).to(DEVICE)

        self.data_collator = DataCollatorForTokenClassification(
            self.tokenizer, padding="longest"
        )

    def train(
        self,
        train_dataset,
        epochs: int,
        batch_size: int,
        learning_rate: float,
        train_access_token: str,
        eval_dataset=None,
        output_dir: str = "./models",
    ) -> dict:
        training_args = TrainingArguments(
            output_dir=output_dir,
            eval_steps=10,
            eval_strategy="epoch" if eval_dataset else "no",
            save_strategy="epoch",
            learning_rate=learning_rate,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            num_train_epochs=epochs,
            weight_decay=0.01,
            logging_steps=settings.TRAIN_LOGGING_STEPS,
            load_best_model_at_end=bool(eval_dataset),
            metric_for_best_model="f1",
            greater_is_better=True,
            push_to_hub=False,
            report_to="none",
            fp16=torch.cuda.is_available(),
            dataloader_num_workers=2,
            save_total_limit=1,
            max_grad_norm=1.0,
            optim="adamw_torch",
            lr_scheduler_type="linear",
            warmup_steps=0.1,
            dataloader_pin_memory=False,
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=self.data_collator,
            compute_metrics=(
                lambda p: compute_metrics(p, self.label_list)
                if eval_dataset
                else None
            ),
            callbacks=[
                ProgressCallback(
                    train_access_token=train_access_token,
                    total_epochs=epochs,
                )
            ],
        )

        torch.cuda.empty_cache()
        gc.collect()
        trainer.train()

        return {"model_dir": output_dir}

# ========================= model_files.py =========================

import csv
import io
import zipfile
from datasets import Dataset
import httpx
from app.core.config import settings


def get_all_sentences(train_access_token: str):
    all_sentences = []

    response = httpx.post(
        settings.GET_TRAINING_FILES_URL,
        json={"train_access_token": train_access_token},
    )
    response.raise_for_status()

    zip_bytes = io.BytesIO(response.content)

    with zipfile.ZipFile(zip_bytes) as zip_file:
        for file_name in zip_file.namelist():
            with zip_file.open(file_name) as file:
                text = file.read().decode("utf-8")
                all_sentences.extend(parse_csv_from_text(text))
                if len(all_sentences) > 3000:
                    break

    return all_sentences


def parse_csv_from_text(text: str):
    sentences = []
    reader = csv.reader(io.StringIO(text), skipinitialspace=True)
    next(reader, None)
    for row in reader:
        if len(row) < 2:
            continue
        tokens = row[0].split()
        labels = row[1].split()
        if len(tokens) != len(labels):
            continue
        sentences.append(
            [{"token": t, "label": l} for t, l in zip(tokens, labels)]
        )
    return sentences


def extract_labels_from_sentences(sentences):
    labels = set()
    for sent in sentences:
        for item in sent:
            if item["label"] != "O":
                labels.add(item["label"])
    return sorted(labels) + ["O"]


def prepare_dataset(sentences, tokenizer, label2id, max_length):
    tokens = [[i["token"] for i in s] for s in sentences]
    tags = [[i["label"] for i in s] for s in sentences]
    dataset = Dataset.from_dict({"tokens": tokens, "ner_tags": tags})
    return dataset

# ========================= model_router.py =========================

import tempfile
import time
import httpx
from app.services.model_class import NERModel
from app.services.model_files import (
    extract_labels_from_sentences,
    get_all_sentences,
    prepare_dataset,
)
from app.core.config import settings
""")
        tmp.flush()

    return FileResponse(
        tmp.name, filename=model_db.name, media_type="application/octet-stream"
    )


@router.delete("/{model_id}/train", response_model=ModelFullResponse)
async def stop_train_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    model_db = stop_train_model_by_id(
        project_id=project_id,
        model_id=model_id,
        user_id=user_id,
        db=db,
    )

    return ToModelFullResponse(model_db=model_db)


@router.delete("/{model_id}", response_model=GetEchoResponse)
async def delete_by_id(
    project_id: int,
    model_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    delete_model_by_id(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    return GetEchoResponse(detail="Модель успешно удалена", success=True)
