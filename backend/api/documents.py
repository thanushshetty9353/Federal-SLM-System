from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import hashlib
import os

from backend.models.database import get_db
from backend.models.document_model import Document
from backend.models.ocr_model import OCRResult
from backend.services.ocr_service import extract_text
from backend.services.slm_service import process_text   # ✅ ADD THIS
from backend.utils.config import STORAGE_PATH

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    org_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Create storage folder
    os.makedirs(STORAGE_PATH, exist_ok=True)

    file_location = f"{STORAGE_PATH}/{file.filename}"

    # Save file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Generate hash
    with open(file_location, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    # Save document record
    new_doc = Document(
        org_id=org_id,
        file_name=file.filename,
        document_hash=file_hash
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # =========================
    # OCR + SLM PIPELINE
    # =========================
    try:
        # OCR
        extracted_text = extract_text(file_location)

        ocr_entry = OCRResult(
            document_id=new_doc.doc_id,
            extracted_text=extracted_text
        )

        db.add(ocr_entry)
        db.commit()

        # 🔥 SLM PROCESSING (NEW)
        slm_result = process_text(extracted_text, db)

    except Exception as e:
        extracted_text = f"OCR Failed: {str(e)}"
        slm_result = {}

    return {
        "message": "Document uploaded and processed",
        "doc_id": new_doc.doc_id,
        "extracted_text": extracted_text,
        "slm_output": slm_result   # ✅ IMPORTANT
    }