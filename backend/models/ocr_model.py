from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from backend.models.database import Base


class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.doc_id"))
    extracted_text = Column(Text)

    document = relationship("Document")