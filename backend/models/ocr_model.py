from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.models.database import Base


class OCRResult(Base):
    __tablename__ = "ocr_results"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Link to Document
    document_id = Column(Integer, ForeignKey("documents.doc_id"), nullable=False)

    # Extracted OCR text
    extracted_text = Column(Text, nullable=False)

    # Optional metadata (layout, tables, etc.)
    layout_metadata = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔗 Relationships

    # Link back to Document
    document = relationship("Document", back_populates="ocr_results")

    # Link to SLM Insights (Stage 3 → Stage 4 bridge)
    slm_insights = relationship(
        "SLMInsights",
        back_populates="ocr_result",
        cascade="all, delete-orphan"
    )