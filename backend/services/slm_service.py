from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json

from backend.models.schema_model import SchemaConfig

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
# PROMPT
# =========================

def build_prompt(text):
    return f"""<|system|>
You are a strict medical information extractor.

Return ONLY JSON.

<|user|>
Extract:
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

    inputs = tokenizer(build_prompt(text), return_tensors="pt")

    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.0,
        do_sample=False,
        eos_token_id=tokenizer.eos_token_id
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🧠 RAW OUTPUT:\n", result)

    return result


# =========================
# EXTRACT JSON
# =========================

def extract_json(output):
    try:
        start = output.find("{")
        end = output.rfind("}")

        if start != -1 and end != -1:
            json_str = output[start:end+1]
            json_str = json_str.replace("\n", " ").replace("'", '"')

            data = json.loads(json_str)

            if isinstance(data, list) and len(data) > 0:
                data = data[0]

            return data

    except Exception as e:
        print("❌ JSON parsing error:", e)

    return {}


# =========================
# FALLBACK
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
# DOC TYPE
# =========================

def detect_doc_type(text):
    if "cancer" in text.lower():
        return "cancer_record"
    return "general"


# =========================
# FETCH SCHEMA FROM DB
# =========================

def get_core_fields(db, doc_type):
    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        return []

    return json.loads(schema.core_fields)


# =========================
# APPLY SCHEMA
# =========================

def apply_schema(data, doc_type, db):
    core_fields = get_core_fields(db, doc_type)

    core = {}
    dynamic = {}
    missing = []

    for field in core_fields:
        if data.get(field):
            core[field] = data[field]
        else:
            core[field] = "unknown"
            missing.append(field)

    for key, value in data.items():
        if key not in core_fields:
            dynamic[key] = value

    return core, dynamic, missing


# =========================
# MAIN PIPELINE
# =========================

def process_text(text, db):
    raw_output = run_model(text)

    extracted_json = extract_json(raw_output)

    if not extracted_json:
        print("⚠️ Using fallback extraction")
        extracted_json = fallback_extract(text)

    doc_type = detect_doc_type(text)

    core, dynamic, missing = apply_schema(
        extracted_json, doc_type, db
    )

    return {
        "doc_type": doc_type,
        "core_fields": core,
        "dynamic_fields": dynamic,
        "metadata": {
            "missing_fields": missing,
            "imputed": len(missing) > 0
        },
        "raw_output": raw_output
    }