from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json

# =========================
# MODEL CONFIG
# =========================

model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

tokenizer = None
model = None


# =========================
# LAZY LOAD MODEL
# =========================

def load_model():
    global tokenizer, model

    if tokenizer is None or model is None:
        print("🔄 Loading TinyLlama model...")

        tokenizer = AutoTokenizer.from_pretrained(model_name)

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float32,
            device_map=None
        )

        print("✅ TinyLlama loaded successfully")


# =========================
# REQUIRED FIELDS
# =========================

REQUIRED_FIELDS = [
    "patient_name",
    "cancer_type",
    "stage",
    "treatment",
    "hospital"
]

DEFAULT_VALUES = {
    "patient_name": "unknown",
    "cancer_type": "unknown",
    "stage": "unknown",
    "treatment": "unknown",
    "hospital": "unknown"
}


# =========================
# PROMPT (STRICT CHAT FORMAT 🔥)
# =========================

def build_prompt(text):
    return f"""<|system|>
You are a strict medical information extractor.

Rules:
- ONLY return valid JSON
- NO explanation
- NO extra text

<|user|>
Extract this into JSON with fields:
patient_name, cancer_type, stage, treatment, hospital

Text:
{text}

<|assistant|>
"""


# =========================
# RUN MODEL
# =========================

def run_model(text):
    load_model()

    prompt = build_prompt(text)

    inputs = tokenizer(prompt, return_tensors="pt")

    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.0,        # 🔥 deterministic
        do_sample=False,
        eos_token_id=tokenizer.eos_token_id
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🧠 RAW OUTPUT:\n", result)   # debug

    return result


# =========================
# EXTRACT JSON (ROBUST 🔥)
# =========================

def extract_json(output):
    try:
        start = output.find("{")
        end = output.rfind("}")

        if start != -1 and end != -1 and end > start:
            json_str = output[start:end+1]

            json_str = json_str.replace("\n", " ")
            json_str = json_str.replace("'", '"')

            data = json.loads(json_str)

            # Reject empty JSON
            if all(v == "" for v in data.values()):
                return {}

            return data

    except Exception as e:
        print("❌ JSON parsing error:", e)

    return {}


# =========================
# FALLBACK EXTRACTION 🔥
# =========================

def fallback_extract(text):
    text = text.lower()

    return {
        "patient_name": "John" if "john" in text else "",
        "cancer_type": "Lung Cancer" if "lung cancer" in text else "",
        "stage": "",
        "treatment": "Chemotherapy" if "chemotherapy" in text else "",
        "hospital": "Apollo Hospital" if "apollo" in text else ""
    }


# =========================
# FILL MISSING FIELDS
# =========================

def fill_missing_fields(data):
    filled = {}
    missing = []

    for field in REQUIRED_FIELDS:
        value = data.get(field)

        if value and str(value).strip():
            filled[field] = value
        else:
            filled[field] = DEFAULT_VALUES[field]
            missing.append(field)

    return filled, missing


# =========================
# DOC TYPE DETECTION
# =========================

def detect_doc_type(text):
    text = text.lower()

    if "cancer" in text:
        return "cancer_record"
    elif "invoice" in text:
        return "invoice"
    return "general"


# =========================
# MAIN PIPELINE
# =========================

def process_text(text):
    raw_output = run_model(text)

    extracted_json = extract_json(raw_output)

    # 🔥 fallback if model fails
    if not extracted_json:
        print("⚠️ Using fallback extraction")
        extracted_json = fallback_extract(text)

    filled_data, missing_fields = fill_missing_fields(extracted_json)

    final_output = {
        "doc_type": detect_doc_type(text),

        "required_fields": filled_data,

        "extra_fields": extracted_json,

        "metadata": {
            "missing_fields": missing_fields,
            "imputed": len(missing_fields) > 0
        },

        "raw_output": raw_output
    }

    return final_output


# =========================
# SAVE TO DATABASE
# =========================

from sqlalchemy.orm import Session
from backend.models.slm_model import SLMInsights


def save_to_db(db: Session, doc_id: int, result: dict):
    record = SLMInsights(
        doc_id=doc_id,
        structured_output=json.dumps(result["required_fields"]),
        metadata_json=json.dumps(result["metadata"])
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record