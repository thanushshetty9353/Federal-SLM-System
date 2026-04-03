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
        # =========================
        # AUTH + ORG VALIDATION
        # =========================
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
        # HASH CHECK (DUPLICATE)
        # =========================
        with open(file_location, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        existing = db.query(Document).filter(
            Document.document_hash == file_hash,
            Document.org_id == org_id
        ).first()

        # 🔥 DO NOT FAIL ON DUPLICATE
        if existing:
            print("⚠️ Duplicate document detected, reprocessing...")
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
        # OCR PROCESSING
        # =========================
        extracted_text = extract_text(file_location)

        print("\n📄 OCR TEXT PREVIEW:\n", extracted_text[:500])

        if not extracted_text or "Error" in extracted_text:
            raise Exception("OCR failed or returned empty text")

        ocr_entry = OCRResult(
            document_id=new_doc.doc_id,
            extracted_text=extracted_text
        )

        db.add(ocr_entry)
        db.commit()
        db.refresh(ocr_entry)

        # =========================
        # 🔥 DATA TYPE DETECTION
        # =========================
        if "radius_mean" in extracted_text:
            print("📊 Detected structured dataset → parsing manually")

            tokens = extracted_text.strip().split()

            headers = tokens[:6]
            values = tokens[6:]

            records = []
            row_size = len(headers)

            for i in range(0, len(values), row_size):
                row = values[i:i + row_size]

                if len(row) != row_size:
                    continue

                try:
                    record = {
                        "id": int(float(row[0])),
                        "label": int(float(row[1])),
                        "radius_mean": float(row[2]),
                        "texture_mean": float(row[3]),
                        "perimeter_mean": float(row[4]),
                        "area_mean": float(row[5]),
                    }
                    records.append(record)
                except Exception as parse_error:
                    print("⚠️ Skipping row due to parse error:", parse_error)

            slm_result = records

        else:
            print("🧠 Using SLM extraction")

            slm_result = process_text(extracted_text, db)

            if not slm_result:
                print("⚠️ SLM returned empty result")

            records = slm_result if isinstance(slm_result, list) else [slm_result]

        print(f"📦 Extracted {len(records)} records")

        # =========================
        # SAVE DATASET
        # =========================
        save_records(records, org_id)

        # =========================
        # SAVE SLM OUTPUT
        # =========================
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
            "org_id": org_id,
            "records_extracted": len(records),
            "dataset_file": f"storage/org_{org_id}/dataset.json",
            "preview": records[:3]  # 🔥 only first 3 records
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        db.rollback()
        print("❌ ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))