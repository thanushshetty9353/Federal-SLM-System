from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from backend.models.database import get_db
from backend.models.schema_model import SchemaConfig

router = APIRouter()


@router.post("/schema/create")
def create_schema(data: dict, db: Session = Depends(get_db)):

    doc_type = data.get("doc_type")
    core_fields = data.get("core_fields", [])

    existing = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if existing:
        existing.core_fields = json.dumps(core_fields)
        existing.num_core_fields = len(core_fields)
    else:
        new_schema = SchemaConfig(
            doc_type=doc_type,
            core_fields=json.dumps(core_fields),
            num_core_fields=len(core_fields)
        )
        db.add(new_schema)

    db.commit()

    return {"message": "Schema saved"}