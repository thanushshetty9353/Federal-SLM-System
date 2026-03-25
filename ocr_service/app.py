from fastapi import FastAPI, UploadFile, File
import shutil
import os
from ocr_service.ocr_engine import extract_text

app = FastAPI()

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/ocr")
async def run_ocr(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run OCR
        text = extract_text(file_path)

        return {"text": text}

    except Exception as e:
        return {"error": str(e)}

    finally:
        # Cleanup file
        if os.path.exists(file_path):
            os.remove(file_path)