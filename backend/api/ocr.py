from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.ocr_service import extract_text
from services.slm_service import process_text, save_to_db

from models.database import get_db
from models.ocr_model import OCRResult

router = APIRouter()

@router.post("/ocr/extract")
def run_ocr(path: str, db: Session = Depends(get_db)):

    # =========================
    # STEP 1: OCR
    # =========================
    text = extract_text(path)

    ocr_entry = OCRResult(
        document_id=None,
        extracted_text=text
    )

    db.add(ocr_entry)
    db.commit()
    db.refresh(ocr_entry)

    # =========================
    # STEP 2: SLM PROCESSING 🔥
    # =========================
    slm_result = process_text(text)

    # =========================
    # STEP 3: SAVE SLM OUTPUT
    # =========================
    save_to_db(db, ocr_entry.id, slm_result)

    # =========================
    # FINAL RESPONSE
    # =========================
    return {
        "message": "OCR + SLM completed",
        "ocr_text": text,
        "slm_output": slm_result
    }