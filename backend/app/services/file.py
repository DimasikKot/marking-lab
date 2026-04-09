from pathlib import Path
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db import File
from app.services.project import is_owner_of_project
from app.services.bio_validator import validate_and_normalize_bio


def get_file_storage_path(project_id: int, file_id: int) -> Path:
    storage_dir = Path(settings.FILE_STORAGE_PATH).resolve()
    return storage_dir / str(project_id) / f"{file_id}.csv"  # теперь всегда .csv


def save_file_to_disk(project_id: int, file_id: int, content: str):
    file_path = get_file_storage_path(project_id, file_id)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")


def read_file_from_disk(project_id: int, file_id: int) -> str | None:
    file_path = get_file_storage_path(project_id, file_id)
    if not file_path.exists():
        return None
    return file_path.read_text(encoding="utf-8")


def delete_file_from_disk(project_id: int, file_id: int):
    file_path = get_file_storage_path(project_id, file_id)
    if file_path.exists():
        file_path.unlink(missing_ok=True)


def parse_bio_csv(content: str) -> list[dict]:
    """Превращаем CSV в список предложений для ML"""
    import csv
    from io import StringIO

    f = StringIO(content)
    reader = csv.DictReader(f)
    return [{"text": row["text"], "labels": row["labels"]} for row in reader]


# === Остальные функции без изменений (is_owner_of_file и т.д.) ===
def is_owner_of_file(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    if not is_owner_of_project(db, project_id, user_id):
        return False
    return (
        db.query(File).filter(File.id == file_id, File.project_id == project_id).first()
        is not None
    )


def create_file_by_project_id(
    db: Session, name: str, project_id: int, user_id: int, content: str
) -> File | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    validated_content = validate_and_normalize_bio(content)
    file: File = File(name=name, project_id=project_id)
    db.add(file)
    db.commit()
    db.refresh(file)
    save_file_to_disk(project_id, file.id, validated_content)
    return file


def fetch_files_by_project_id(
    db: Session,
    project_id: int,
    user_id: int,
    search: str | None = None,
    sort: str | None = None,
) -> list[File] | None:
    if not is_owner_of_project(db, project_id, user_id):
        return None
    query = db.query(File).filter(File.project_id == project_id)
    if search:
        query = query.filter(File.name.ilike(f"%{search}%"))
    if sort == "name_asc":
        query = query.order_by(File.name.asc())
    elif sort == "name_desc":
        query = query.order_by(File.name.desc())
    else:
        query = query.order_by(File.created_at.desc())
    return query.all()


def fetch_file_by_id(
    db: Session, project_id: int, user_id: int, file_id: int
) -> File | None:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    return db.query(File).filter(File.id == file_id).first()


def update_file_by_id(
    db: Session,
    project_id: int,
    user_id: int,
    file_id: int,
    new_name: str,
    new_content: str,
) -> File | None:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return None
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return None
    validated_content = validate_and_normalize_bio(new_content)
    file.name = new_name
    save_file_to_disk(project_id, file_id, validated_content)
    db.commit()
    db.refresh(file)
    return file


def delete_file_by_id(db: Session, project_id: int, user_id: int, file_id: int) -> bool:
    if not is_owner_of_file(db, project_id, user_id, file_id):
        return False
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return False
    db.delete(file)
    db.commit()
    delete_file_from_disk(project_id, file_id)
    return True
