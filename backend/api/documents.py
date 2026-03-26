import shutil
import hashlib
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.document_model import Document
from backend.models.ocr_model import OCRResult
from backend.models.slm_model import SLMInsights

from backend.services.ocr_service import extract_text
from backend.services.slm_service import process_text

# 🔥 NEW IMPORTS
from backend.services.parser_service import parse_multiple_records
from backend.services.dataset_service import save_records

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
        # HASH
        # =========================
        with open(file_location, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

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
        # OCR
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
        # 🔥 NEW: PARSE MULTIPLE RECORDS
        # =========================
        records = parse_multiple_records(extracted_text)

        # Save into dataset.json
        save_records(records)

        # =========================
        # SLM
        # =========================
        slm_result = process_text(extracted_text, db)

        slm_entry = SLMInsights(
            doc_id=ocr_entry.id,
            structured_output=str(slm_result),
            metadata_json="{}"
        )

        db.add(slm_entry)

        # =========================
        # FINALIZE
        # =========================
        new_doc.is_processed = True
        db.commit()

        return {
            "message": "Document processed successfully",
            "doc_id": new_doc.doc_id,
            "records_extracted": len(records),
            "slm_output": slm_result
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )