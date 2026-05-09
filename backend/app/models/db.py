from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import (
    Enum,
    Integer,
    String,
    Boolean,
    TIMESTAMP,
    ForeignKey,
)

from app.core.database import Base

ModelFileRole = Enum(
    "training",
    "prediction",
    name="model_file_role",
)


class ProjectDB(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    files = relationship(
        "FileDB",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    models = relationship(
        "ModelDB",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class FileDB(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    is_labeled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("ProjectDB", back_populates="files")
    model_links = relationship(
        "ModelFileDB",
        back_populates="file",
        cascade="all, delete-orphan",
    )


from sqlalchemy.dialects.postgresql import JSONB


class ModelDB(Base):
    __tablename__ = "models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=True)
    saved_in_memory: Mapped[bool] = mapped_column(Boolean, default=False)

    parameters: Mapped[dict] = mapped_column(JSONB, server_default="{}")
    metrics: Mapped[dict] = mapped_column(JSONB, server_default="{}")
    graphs: Mapped[dict] = mapped_column(JSONB, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    project = relationship("ProjectDB", back_populates="models")
    file_links = relationship(
        "ModelFileDB",
        back_populates="model",
        cascade="all, delete-orphan",
    )


class ModelFileDB(Base):
    __tablename__ = "model_files"

    model_id: Mapped[int] = mapped_column(
        ForeignKey("models.id", ondelete="CASCADE"),
        primary_key=True,
    )
    file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role: Mapped[str] = mapped_column(
        ModelFileRole,
        primary_key=True,
    )

    model = relationship("ModelDB", back_populates="file_links")
    file = relationship("FileDB", back_populates="model_links")
