from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
import json

from backend.models.database import get_db
from backend.models.schema_model import SchemaConfig

router = APIRouter(prefix="/schema", tags=["Schema"])


# =========================
# REQUEST MODEL (UPDATED)
# =========================
class SchemaRequest(BaseModel):
    doc_type: str
    core_fields: Dict[str, str]     # 🔥 CHANGED
    dynamic_fields: Dict[str, str] = {}  # 🔥 CHANGED


# =========================
# CREATE / UPDATE SCHEMA
# =========================
@router.post("/create")
def create_schema(request: SchemaRequest, db: Session = Depends(get_db)):

    try:
        existing = db.query(SchemaConfig).filter(
            SchemaConfig.doc_type == request.doc_type
        ).first()

        if existing:
            # 🔄 UPDATE
            existing.core_fields = json.dumps(request.core_fields)
            existing.dynamic_fields = json.dumps(request.dynamic_fields)
            existing.num_core_fields = len(request.core_fields)

        else:
            # 🆕 CREATE
            new_schema = SchemaConfig(
                doc_type=request.doc_type,
                core_fields=json.dumps(request.core_fields),
                dynamic_fields=json.dumps(request.dynamic_fields),
                num_core_fields=len(request.core_fields)
            )

            db.add(new_schema)

        db.commit()

        return {
            "message": "Schema saved successfully",
            "doc_type": request.doc_type,
            "core_fields": request.core_fields,
            "dynamic_fields": request.dynamic_fields
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# GET SCHEMA
# =========================
@router.get("/{doc_type}")
def get_schema(doc_type: str, db: Session = Depends(get_db)):

    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    return {
        "doc_type": schema.doc_type,
        "core_fields": json.loads(schema.core_fields),
        "dynamic_fields": json.loads(schema.dynamic_fields)
        if schema.dynamic_fields else {}
    }


# =========================
# GET ALL SCHEMAS
# =========================
@router.get("/")
def get_all_schemas(db: Session = Depends(get_db)):

    schemas = db.query(SchemaConfig).all()

    result = []

    for s in schemas:
        result.append({
            "doc_type": s.doc_type,
            "core_fields": json.loads(s.core_fields),
            "dynamic_fields": json.loads(s.dynamic_fields)
            if s.dynamic_fields else {}
        })

    return result