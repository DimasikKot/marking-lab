from typing import Any, Literal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.db import FileDB, ModelDB
from app.services.project import is_owner_of_project


def is_owner_of_model(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    if (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
        is None
    ):
        raise HTTPException(status_code=404, detail="Нет доступа к модели")


# router
def create_model(
    project_id: int,
    user_id: int,
    db: Session,
    name: str,
    files_ids: list[int] | None,
) -> ModelDB:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    model_db = ModelDB(name=name, project_id=project_id)

    if files_ids is not None:
        # Получаем текущие связанные файлы
        current_files = {file.id: file for file in model_db.files}

        # Загружаем новые файлы из БД
        new_files = db.query(FileDB).filter(FileDB.id.in_(files_ids)).all()
        new_files_dict = {file.id: file for file in new_files}

        # Удаляем старые связи
        for file_id in list(current_files.keys()):
            if file_id not in new_files_dict:
                model_db.files.remove(current_files[file_id])

        # Добавляем новые связи
        for file_id, file_db in new_files_dict.items():
            if file_id not in current_files:
                model_db.files.append(file_db)

    db.add(model_db)
    db.commit()
    db.refresh(model_db)

    return model_db


# router
def fetch_model_db_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> ModelDB:
    is_owner_of_model(project_id=project_id, model_id=model_id, user_id=user_id, db=db)

    model_db = (
        db.query(ModelDB)
        .filter(ModelDB.id == model_id, ModelDB.project_id == project_id)
        .first()
    )

    if not model_db:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    return model_db


SortType = Literal[
    "name_asc",
    "name_desc",
    "created_at_asc",
    "created_at_desc",
    "updated_at_asc",
    "updated_at_desc",
]


# router
def fetch_models_db_by_project_id(
    project_id: int,
    user_id: int,
    db: Session,
    sort: SortType | None,
    search: str | None,
) -> list[ModelDB]:
    is_owner_of_project(project_id=project_id, user_id=user_id, db=db)

    models_db = db.query(ModelDB).filter(ModelDB.project_id == project_id)

    if search is not None:
        models_db = models_db.filter(ModelDB.name.ilike(f"%{search}%"))

    if sort == "name_asc":
        models_db = models_db.order_by(ModelDB.name.asc())
    elif sort == "name_desc":
        models_db = models_db.order_by(ModelDB.name.desc())
    elif sort == "created_at_asc":
        models_db = models_db.order_by(ModelDB.created_at.asc())
    elif sort == "created_at_desc":
        models_db = models_db.order_by(ModelDB.created_at.desc())
    elif sort == "updated_at_asc":
        models_db = models_db.order_by(ModelDB.updated_at.asc())
    elif sort == "updated_at_desc":
        models_db = models_db.order_by(ModelDB.updated_at.desc())

    return models_db.all()


# router
def update_model_db_by_id(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
    name: str | None,
    parameters: dict[str, Any] | None,
    files_ids: list[int] | None,
) -> ModelDB:
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    if name is not None:
        model_db.name = name

    if parameters is not None:
        if model_db.is_draft is False:
            raise HTTPException(
                status_code=400, detail="Нельзя изменять параметры обученной модели"
            )
        model_db.parameters = parameters

    if files_ids is not None:
        if model_db.is_draft is False:
            raise HTTPException(
                status_code=400, detail="Нельзя изменять файлы обученной модели"
            )

        # Получаем текущие связанные файлы
        current_files = {file.id: file for file in model_db.files}

        # Загружаем новые файлы из БД
        new_files = db.query(FileDB).filter(FileDB.id.in_(files_ids)).all()
        new_files_dict = {file.id: file for file in new_files}

        # Удаляем старые связи
        for file_id in list(current_files.keys()):
            if file_id not in new_files_dict:
                model_db.files.remove(current_files[file_id])

        # Добавляем новые связи
        for file_id, file_db in new_files_dict.items():
            if file_id not in current_files:
                model_db.files.append(file_db)

    db.commit()
    db.refresh(model_db)
    return model_db


# router
def train_model_by_id(
    project_id: int,
    model_id: int,
    user_id: int,
    db: Session,
) -> ModelDB:
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    if model_db.is_draft is False:
        raise HTTPException(
            status_code=400, detail="Нельзя обучать уже обученную модель"
        )

    if len(model_db.files) == 0:
        raise HTTPException(status_code=400, detail="Выберите файлы для обучения")

    model_db.is_draft = False

    db.commit()
    db.refresh(model_db)

    # TODO: отправляем параметры и файлы модели в обучающий сервис
    # получаем оттуда метрики и графики
    # обновляем данные в БД

    return model_db


# router
def delete_model_by_id(
    project_id: int, model_id: int, user_id: int, db: Session
) -> None:
    model_db = fetch_model_db_by_id(
        project_id=project_id, model_id=model_id, user_id=user_id, db=db
    )

    db.delete(model_db)
    db.commit()
