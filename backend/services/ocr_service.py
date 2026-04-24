import requests
import os

OCR_URL = "http://127.0.0.1:9001/ocr"


def extract_text(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} not found")

    try:
        with open(file_path, "rb") as f:
            response = requests.post(
                OCR_URL,
                files={"file": f},
                timeout=30
            )

        response.raise_for_status()
        data = response.json()

        text = data.get("text", "")

        print("\n📄 OCR RAW TEXT:\n", text)

        if not text.strip():
            return ""

        return text

    except Exception as e:
        print("⚠️ OCR FAILED:", e)
        return ""