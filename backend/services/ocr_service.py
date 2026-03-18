import os

# 🔥 CRITICAL FIXES (must be first)
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

from paddleocr import PaddleOCR

# Initialize OCR
ocr = PaddleOCR(use_angle_cls=True, lang='en')


def extract_text(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} not found")

    try:
        result = ocr.ocr(file_path)
    except Exception as e:
        return f"OCR Engine Error: {str(e)}"

    extracted_text = []

    if result is None:
        return ""

    for line in result:
        if line is None:
            continue
        for word in line:
            if word and len(word) > 1:
                extracted_text.append(word[1][0])

    return " ".join(extracted_text)