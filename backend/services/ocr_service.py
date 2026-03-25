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
                files={"file": f}
            )

        response.raise_for_status()
        return response.json().get("text", "")

    except Exception as e:
        return f"OCR API Error: {str(e)}"