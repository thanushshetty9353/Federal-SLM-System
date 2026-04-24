import os

# 🔥 CRITICAL FIXES (MUST BE BEFORE IMPORT)

# Disable PIR (fix for paddle 2.6.x error)
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_new_ir_in_executor"] = "0"

# Performance / stability flags
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

from paddleocr import PaddleOCR

# 🔥 Initialize OCR once (important for performance)
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    show_log=False  # cleaner logs
)


def extract_text(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_path} not found")

    try:
        result = ocr.ocr(file_path)
    except Exception as e:
        return f"OCR Engine Error: {str(e)}"

    extracted_text = []

    # Handle empty result safely
    if not result:
        return ""

    for line in result:
        if not line:
            continue

        for word in line:
            try:
                # word format: [[x1,y1],[x2,y2]...], (text, confidence)
                text = word[1][0]
                if text:
                    extracted_text.append(text)
            except Exception:
                continue

    return " ".join(extracted_text)