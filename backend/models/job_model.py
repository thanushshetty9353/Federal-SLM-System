from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from backend.models.database import Base


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, COMPLETED

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<TrainingJob id={self.id} title={self.title} status={self.status}>"


class OrgJob(Base):
    __tablename__ = "org_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("training_jobs.id"), nullable=False, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    status = Column(String, default="JOINED")  # JOINED, TRAINED
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<OrgJob job_id={self.job_id} org_id={self.org_id} status={self.status}>"
