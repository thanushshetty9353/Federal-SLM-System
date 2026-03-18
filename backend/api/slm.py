from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.slm_service import process_text

router = APIRouter()

class SLMRequest(BaseModel):
    text: str

@router.post("/analyze")
def analyze(request: SLMRequest):
    return process_text(request.text)