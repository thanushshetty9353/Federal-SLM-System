from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from backend.models.database import get_db
from backend.services.slm_service import process_text
from backend.services.blockchain_service import log_action

router = APIRouter(
    prefix="/slm",
    tags=["SLM"]
)


class SLMRequest(BaseModel):

    text: str

    doc_type: Optional[str] = "cancer"


@router.post("/analyze")
def analyze(
    request: SLMRequest,
    db: Session = Depends(get_db)
):

    result = process_text(
        text=request.text,
        db=db,
        doc_type=request.doc_type
    )

    # =========================
    # BLOCKCHAIN LOG
    # =========================

    log_action(
        org_id=0,
        action="SLM_ANALYSIS",
        details="Ollama analysis completed"
    )

    return {
        "success": True,
        "data": result
    }