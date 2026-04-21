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

    files = relationship("File", back_populates="project", cascade="all, delete-orphan")
    models = relationship(
        "Model", back_populates="project", cascade="all, delete-orphan"
    )
    experiments = relationship(
        "Experiment", back_populates="project", cascade="all, delete-orphan"
    )


class FileDB(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="files")
    models = relationship(
        "Model", secondary=model_training_files_table, back_populates="files"
    )
    experiments = relationship(
        "Experiment",
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
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    saved_in_memory: Mapped[bool] = mapped_column(Boolean, default=False)
    parameters: Mapped[dict[str, Any]] = mapped_column(
        JSON
    )  # сюда сохраняются веса/параметры после обучения

    project = relationship("Project", back_populates="models")
    experiments = relationship("Experiment", back_populates="model")
    files = relationship(
        "File", secondary=model_training_files_table, back_populates="models"
    )


class ExperimentDB(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    model_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("models.id", ondelete="SET NULL"), nullable=True
    )
    results: Mapped[dict[str, Any]] = mapped_column(JSON)
    graphs: Mapped[dict[str, Any]] = mapped_column(JSON)

    project = relationship("Project", back_populates="experiments")
    model = relationship("Model", back_populates="experiments")
    test_files = relationship(
        "File", secondary=experiment_testing_files_table, back_populates="experiments"
    )
