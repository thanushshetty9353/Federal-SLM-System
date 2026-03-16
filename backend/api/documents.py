from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import hashlib
import os

from backend.models.database import get_db
from backend.models.document_model import Document
from backend.utils.config import STORAGE_PATH

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    org_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Create storage folder if not exists
    os.makedirs(STORAGE_PATH, exist_ok=True)

    file_location = f"{STORAGE_PATH}/{file.filename}"

    # Save uploaded file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Generate SHA256 hash
    with open(file_location, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    # Create database record
    new_doc = Document(
        org_id=org_id,
        file_name=file.filename,
        document_hash=file_hash
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "message": "Document uploaded successfully",
        "doc_id": new_doc.doc_id
    }