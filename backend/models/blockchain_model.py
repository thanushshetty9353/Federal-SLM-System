from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.models.database import Base


class BlockchainLog(Base):
    __tablename__ = "blockchain_logs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer)
    action = Column(String)
    doc_hash = Column(String, nullable=True)
    block_hash = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)