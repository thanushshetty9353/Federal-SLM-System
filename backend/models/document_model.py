from sqlalchemy import Column, Integer, String, TIMESTAMP
import datetime

from backend.models.database import Base


class Document(Base):

    __tablename__ = "documents"

    doc_id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer)
    file_name = Column(String)
    document_hash = Column(String)
    upload_timestamp = Column(TIMESTAMP, default=datetime.datetime.utcnow)