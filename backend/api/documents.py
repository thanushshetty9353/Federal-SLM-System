from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
import hashlib
import os

from backend.models.database import get_db
from backend.models.document_model import Document
from backend.models.ocr_model import OCRResult
from backend.models.slm_model import SLMInsights
from backend.services.ocr_service import extract_text
from backend.services.slm_service import process_text
from backend.utils.config import STORAGE_PATH

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    org_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # =========================
        # SAVE FILE
        # =========================
        os.makedirs(STORAGE_PATH, exist_ok=True)
        file_location = os.path.join(STORAGE_PATH, file.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # =========================
        # GENERATE HASH
        # =========================
        with open(file_location, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        # =========================
        # STORE DOCUMENT
        # =========================
        new_doc = Document(
            org_id=org_id,
            file_name=file.filename,
            document_hash=file_hash,
            is_processed=False
        )

        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # =========================
        # OCR PROCESSING
        # =========================
        extracted_text = extract_text(file_location)

        if "Error" in extracted_text:
            raise Exception(extracted_text)

        ocr_entry = OCRResult(
            document_id=new_doc.doc_id,
            extracted_text=extracted_text
        )

        db.add(ocr_entry)
        db.commit()
        db.refresh(ocr_entry)

        # =========================
        # SLM PROCESSING
        # =========================
        slm_result = process_text(extracted_text, db)

        # Save SLM output
        slm_entry = SLMInsights(
            doc_id=ocr_entry.id,
            structured_output=str(slm_result),
            metadata_json="{}"
        )

        db.add(slm_entry)

        # =========================
        # FINALIZE DOCUMENT
        # =========================
        new_doc.is_processed = True
        db.commit()

        return {
            "message": "Document uploaded and processed successfully",
            "doc_id": new_doc.doc_id,
            "extracted_text": extracted_text,
            "slm_output": slm_result
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )