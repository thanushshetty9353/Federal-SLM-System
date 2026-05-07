from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    func,
    Text
)

from backend.models.database import Base


class TestModel(Base):

    __tablename__ = "test_models"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(String, nullable=False)

    filename = Column(String, nullable=False)

    original_filename = Column(
        String,
        nullable=False
    )

    format = Column(String, nullable=False)

    schema_doc_type = Column(
        String,
        nullable=True
    )

    uploaded_by = Column(
        Integer,
        nullable=True
    )

    feature_names = Column(
        Text,
        nullable=True
    )

    target_field = Column(
        String,
        nullable=True
    )

    feature_count = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=func.now()
    )