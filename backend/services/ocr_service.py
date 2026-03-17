from paddleocr import PaddleOCR
import os

# Initialize OCR model once
ocr = PaddleOCR(use_angle_cls=True, lang='en')


def extract_text(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} not found")

    result = ocr.ocr(file_path)

    extracted_text = []

    for line in result:
        for word in line:
            extracted_text.append(word[1][0])

    return " ".join(extracted_text)