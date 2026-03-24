from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


model_training_files_table = Table(
    'model_training_files',
    Base.metadata,
    Column('model_id', Integer, ForeignKey('models.id', ondelete='CASCADE'), primary_key=True),
    Column('file_id', Integer, ForeignKey('files.id', ondelete='CASCADE'), primary_key=True)
)


experiment_testing_files_table = Table(
    'experiment_testing_files',
    Base.metadata,
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True),
    Column('file_id', Integer, ForeignKey('files.id', ondelete='CASCADE'), primary_key=True)
)


class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(Integer, nullable=False) 
    is_public = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    files = relationship('File', back_populates='project', cascade='all, delete-orphan')
    models = relationship('Model', back_populates='project', cascade='all, delete-orphan')
    experiments = relationship('Experiment', back_populates='project', cascade='all, delete-orphan')


class File(Base):
    __tablename__ = 'files'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    content = Column(JSON)


    project = relationship('Project', back_populates='files')
    models = relationship('Model', secondary=model_training_files_table, back_populates='files')
    experiments = relationship('Experiment', secondary=experiment_testing_files_table, back_populates='test_files')


class Model(Base):
    __tablename__ = 'models'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_draft = Column(Boolean, default=True)
    saved_in_memory = Column(Boolean, default=False)
    parameters = Column(JSON)


    project = relationship('Project', back_populates='models')
    experiments = relationship('Experiment', back_populates='model')
    files = relationship('File', secondary=model_training_files_table, back_populates='models')


class Experiment(Base):
    __tablename__ = 'experiments'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_draft = Column(Boolean, default=True)
    model_id = Column(Integer, ForeignKey('models.id', ondelete='SET NULL'), nullable=True)
    results = Column(JSON) 
    graphs = Column(JSON)   


    project = relationship('Project', back_populates='experiments')
    model = relationship('Model', back_populates='experiments')
    test_files = relationship('File', secondary=experiment_testing_files_table, back_populates='experiments')