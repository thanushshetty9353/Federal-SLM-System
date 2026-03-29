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
from backend.services.dataset_service import save_records

from backend.utils.config import STORAGE_PATH
from backend.api.deps import require_role

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role(["ORG"]))
):
    try:
        org_id = user.get("org_id")

        if not org_id:
            raise HTTPException(status_code=400, detail="Organization not found in token")

        # =========================
        # SAVE FILE
        # =========================
        org_path = os.path.join(STORAGE_PATH, f"org_{org_id}")
        os.makedirs(org_path, exist_ok=True)

        file_location = os.path.join(org_path, file.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # =========================
        # HASH CHECK
        # =========================
        with open(file_location, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        existing = db.query(Document).filter(
            Document.document_hash == file_hash,
            Document.org_id == org_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Duplicate document")

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
        # SLM
        # =========================
        slm_result = process_text(extracted_text, db)
        records = slm_result if isinstance(slm_result, list) else [slm_result]

        save_records(records, org_id)

        slm_entry = SLMInsights(
            doc_id=ocr_entry.id,
            structured_output=str(slm_result),
            metadata_json="{}"
        )

        db.add(slm_entry)

        new_doc.is_processed = True
        db.commit()

        return {
            "message": "Document processed successfully",
            "doc_id": new_doc.doc_id,
            "org_id": org_id,
            "records_extracted": len(records),
            "dataset_file": f"storage/org_{org_id}/dataset.json",
            "slm_output": slm_result
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")