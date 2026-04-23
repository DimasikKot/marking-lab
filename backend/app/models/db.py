from datetime import datetime
from typing import Any
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    TIMESTAMP,
    JSON,
    ForeignKey,
    Table,
)

from app.core.database import Base


model_training_files_table = Table(
    "model_training_files",
    Base.metadata,
    Column(
        "model_id",
        Integer,
        ForeignKey("models.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "file_id", Integer, ForeignKey("files.id", ondelete="CASCADE"), primary_key=True
    ),
)


experiment_testing_files_table = Table(
    "experiment_testing_files",
    Base.metadata,
    Column(
        "experiment_id",
        Integer,
        ForeignKey("experiments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "file_id", Integer, ForeignKey("files.id", ondelete="CASCADE"), primary_key=True
    ),
)


class ProjectDB(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(255))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    files = relationship(
        "FileDB", back_populates="project", cascade="all, delete-orphan"
    )
    models = relationship(
        "ModelDB", back_populates="project", cascade="all, delete-orphan"
    )
    experiments = relationship(
        "ExperimentDB", back_populates="project", cascade="all, delete-orphan"
    )


class FileDB(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    is_labeled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("ProjectDB", back_populates="files")
    models = relationship(
        "ModelDB", secondary=model_training_files_table, back_populates="files"
    )
    experiments = relationship(
        "ExperimentDB",
        secondary=experiment_testing_files_table,
        back_populates="test_files",
    )


class ModelDB(Base):
    __tablename__ = "models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    saved_in_memory: Mapped[bool] = mapped_column(Boolean, default=False)
    parameters: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default={"model": "ner", "epochs": 3, "batch_size": 4, "learning_rate": 0.001},
    )  # параметры обучения
    metrics: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default={
            "accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1": 0,
            "loss": 0,
            "val_accuracy": 0,
            "val_precision": 0,
            "val_recall": 0,
            "val_f1": 0,
            "val_loss": 0,
        },
    )  # численные метрики на тестовом наборе
    graphs: Mapped[dict[str, Any]] = mapped_column(JSON, default={})  # графики обучения
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("ProjectDB", back_populates="models")
    experiments = relationship("ExperimentDB", back_populates="model")
    files: Mapped[list[FileDB]] = relationship(
        "FileDB", secondary=model_training_files_table, back_populates="models"
    )


class ExperimentDB(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    model_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("models.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    metrics: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        default={
            "accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1": 0,
            "loss": 0,
            "val_accuracy": 0,
            "val_precision": 0,
            "val_recall": 0,
            "val_f1": 0,
            "val_loss": 0,
        },
    )  # численные метрики
    graphs: Mapped[dict[str, Any]] = mapped_column(JSON, default={})  # графики
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("ProjectDB", back_populates="experiments")
    model = relationship("ModelDB", back_populates="experiments")
    test_files: Mapped[list[FileDB]] = relationship(
        "FileDB", secondary=experiment_testing_files_table, back_populates="experiments"
    )
