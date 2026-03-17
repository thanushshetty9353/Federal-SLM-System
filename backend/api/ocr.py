from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from services.ocr_service import extract_text
from models.database import get_db
from models.ocr_model import OCRResult

router = APIRouter()

@router.post("/ocr/extract")
def run_ocr(path: str, db: Session = Depends(get_db)):
    text = extract_text(path)

    ocr_entry = OCRResult(
        document_id=None,  # will link later
        extracted_text=text
    )

    db.add(ocr_entry)
    db.commit()
    db.refresh(ocr_entry)

    return {
        "message": "OCR completed",
        "extracted_text": text
    }