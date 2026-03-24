from sqlalchemy import Column, Integer, String, Text
from backend.models.database import Base


class SchemaConfig(Base):
    __tablename__ = "schema_configs"

    id = Column(Integer, primary_key=True, index=True)

    doc_type = Column(String, unique=True)

    core_fields = Column(Text)        # JSON string
    dynamic_fields = Column(Text)     # ✅ NEW

    num_core_fields = Column(Integer)