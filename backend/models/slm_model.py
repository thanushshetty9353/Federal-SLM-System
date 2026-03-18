from sqlalchemy import Column, Integer, Text, ForeignKey
from backend.models.database import Base


class SLMInsights(Base):
    __tablename__ = "slm_insights"

    insight_id = Column(Integer, primary_key=True, index=True)

    doc_id = Column(Integer, ForeignKey("ocr_results.id"))  # better linking

    structured_output = Column(Text)

    metadata_json = Column(Text)   # ✅ FIXED NAME