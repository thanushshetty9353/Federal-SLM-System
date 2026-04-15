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
from backend.services.blockchain_service import log_action

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
            raise HTTPException(status_code=400, detail="Organization not found")

        # =========================
        # SAVE FILE
        # =========================
        org_path = os.path.join(STORAGE_PATH, f"org_{org_id}")
        os.makedirs(org_path, exist_ok=True)

        file_location = os.path.join(org_path, file.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # =========================
        # HASH
        # =========================
        with open(file_location, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        existing = db.query(Document).filter(
            Document.document_hash == file_hash,
            Document.org_id == org_id
        ).first()

        if existing:
            new_doc = existing
        else:
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

        if not extracted_text:
            raise Exception("OCR failed or returned empty text")

        print("\n📄 OCR OUTPUT:\n", extracted_text)

        ocr_entry = OCRResult(
            document_id=new_doc.doc_id,
            extracted_text=extracted_text
        )

        db.add(ocr_entry)
        db.commit()
        db.refresh(ocr_entry)

        # =========================
        # 🔥 SLM / SMART PARSING
        # =========================
        slm_result = process_text(extracted_text, db)

        records = slm_result if isinstance(slm_result, list) else []

        print("\n📦 FINAL RECORDS:", records)

        # =========================
        # SAVE DATASET
        # =========================
        if records:
            save_records(records, org_id)
        else:
            print("⚠️ No valid records extracted")

        # =========================
        # SAVE SLM OUTPUT
        # =========================
        slm_entry = SLMInsights(
            doc_id=ocr_entry.id,
            structured_output=str(slm_result),
            metadata_json="{}"
        )

        db.add(slm_entry)

        new_doc.is_processed = True
        db.commit()

        # =========================
        # BLOCKCHAIN LOG
        # =========================
        log_action(
            org_id=org_id,
            action="DOCUMENT_PROCESSED",
            doc_hash=file_hash,
            details=file.filename
        )

        return {
            "message": "Document processed successfully",
            "doc_id": new_doc.doc_id,
            "records_extracted": len(records)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))