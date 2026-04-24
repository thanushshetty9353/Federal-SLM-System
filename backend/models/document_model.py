import datetime
from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from backend.models.database import Base


class Document(Base):
    __tablename__ = "documents"

    # Primary Key
    doc_id = Column(Integer, primary_key=True, index=True)

    # Organization ID (for federated learning separation)
    org_id = Column(Integer, nullable=False)

    # File details
    file_name = Column(String, nullable=False)
    document_hash = Column(String, nullable=True)

    # Upload timestamp
    upload_timestamp = Column(
        TIMESTAMP,
        default=datetime.datetime.utcnow
    )

    # Processing status
    is_processed = Column(Boolean, default=False)

    # Whether used in federated training
    used_for_training = Column(Boolean, default=False)

    # 🔗 RELATIONSHIPS

    # One document → many OCR results
    ocr_results = relationship(
        "OCRResult",
        back_populates="document",
        cascade="all, delete-orphan"
    )