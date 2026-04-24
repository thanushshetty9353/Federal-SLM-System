from sqlalchemy import Column, Integer, String
from backend.models.database import Base

class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True)
    status = Column(String)
    model_version = Column(String)