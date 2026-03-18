from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.services.slm_service import process_text

router = APIRouter()


class SLMRequest(BaseModel):
    text: str


@router.post("/analyze")
def analyze(request: SLMRequest, db: Session = Depends(get_db)):
    return process_text(request.text, db)