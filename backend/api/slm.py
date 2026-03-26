from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.services.slm_service import process_text
from typing import Optional

router = APIRouter(prefix="/slm", tags=["SLM"])


class SLMRequest(BaseModel):
    text: str
    doc_type: Optional[str] = None


@router.post("/analyze")
def analyze(request: SLMRequest, db: Session = Depends(get_db)):
    return process_text(
        text=request.text,
        db=db,
        doc_type=request.doc_type
    )