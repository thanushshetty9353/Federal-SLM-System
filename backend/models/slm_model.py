from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.models.database import Base


class SLMInsights(Base):
    __tablename__ = "slm_insights"

    # Primary Key
    insight_id = Column(Integer, primary_key=True, index=True)

    # Foreign Key → OCR Results
    doc_id = Column(Integer, ForeignKey("ocr_results.id"), nullable=False)

    # Structured JSON output from SLM
    structured_output = Column(Text, nullable=False)

    # Metadata (missing fields, confidence, etc.)
    metadata_json = Column(Text, nullable=True)

    # 🔥 NEW FIELDS (IMPORTANT FOR STAGE 4 + 5)

    # Model version used for extraction
    model_version = Column(Integer, default=1)

    # Whether this data was used in federated training
    used_for_training = Column(Boolean, default=False)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship (optional but useful)
    ocr_result = relationship("OCRResult", back_populates="slm_insights")


# 🔥 OPTIONAL: Global Model Tracking (VERY IMPORTANT FOR FEDERATED LEARNING)

class GlobalModel(Base):
    __tablename__ = "global_model"

    id = Column(Integer, primary_key=True, index=True)

    # Serialized weights (can be JSON / pickle / base64)
    weights = Column(Text, nullable=True)

    # Versioning
    version = Column(Integer, default=1)

    # Training round
    training_round = Column(Integer, default=0)

    # Timestamp
    updated_at = Column(DateTime, default=datetime.utcnow)