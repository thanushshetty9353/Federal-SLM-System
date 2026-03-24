from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json

from backend.models.schema_model import SchemaConfig
from backend.services.parser import parse_key_value

model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

tokenizer = None
model = None


# =========================
# LOAD MODEL
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
# DETECT DOC TYPE
# =========================
def detect_doc_type(text):
    text = text.lower()

    if "paracetamol" in text or "prescription" in text:
        return "medical"

    if "invoice" in text:
        return "invoice"

    return "general"


# =========================
# FETCH SCHEMA
# =========================
def get_schema(db, doc_type):
    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        return {
            "core_fields": [],
            "dynamic_fields": []
        }

    return {
        "core_fields": json.loads(schema.core_fields),
        "dynamic_fields": json.loads(schema.dynamic_fields)
        if schema.dynamic_fields else []
    }


# =========================
# 🔥 STRONG PROMPT (FIXED)
# =========================
def build_prompt(text, fields):
    fields_str = ", ".join(fields)

    return f"""
You are an expert information extraction system.

Extract ONLY the following fields from the text.

Fields:
{fields_str}

Rules:
- Return ONLY field_name: value
- DO NOT return field names alone
- DO NOT repeat the input
- DO NOT explain anything
- If value is missing, leave it blank

Example:
patient_name: John
treatment: Paracetamol
disease: Viral fever

Text:
{text}

Answer:
"""


# =========================
# 🔥 CLEAN OUTPUT (FIXED)
# =========================
def clean_output(output, fields):
    lines = output.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        if ":" in line:
            key = line.split(":")[0].strip().lower()

            if key in fields:
                cleaned.append(line)

    return "\n".join(cleaned)


# =========================
# RUN MODEL
# =========================
def run_model(prompt, fields):
    load_model()

    inputs = tokenizer(prompt, return_tensors="pt")

    outputs = model.generate(
        **inputs,
        max_new_tokens=80,   # 🔥 slightly increased
        temperature=0.0,
        do_sample=False,
        eos_token_id=tokenizer.eos_token_id
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🧠 RAW OUTPUT:\n", result)

    cleaned = clean_output(result, fields)

    print("\n✅ CLEANED OUTPUT:\n", cleaned)

    return cleaned


# =========================
# APPLY SCHEMA
# =========================
def apply_schema(parsed, core_fields):
    core = {}
    dynamic = {}
    missing = []

    for field in core_fields:
        value = parsed.get(field, "")
        if value:
            core[field] = value
        else:
            core[field] = ""
            missing.append(field)

    for key, value in parsed.items():
        if key not in core_fields:
            dynamic[key] = value

    return core, dynamic, missing


# =========================
# MAIN PIPELINE
# =========================
def process_text(text, db):

    doc_type = detect_doc_type(text)

    schema = get_schema(db, doc_type)

    core_fields = schema["core_fields"]
    dynamic_fields = schema["dynamic_fields"]

    all_fields = core_fields + dynamic_fields

    # 🔥 If no schema, avoid useless call
    if not all_fields:
        return {
            "doc_type": doc_type,
            "core_fields": {},
            "dynamic_fields": {},
            "metadata": {
                "missing_fields": [],
                "imputed": False
            },
            "raw_output": "No schema defined"
        }

    prompt = build_prompt(text, all_fields)

    raw_output = run_model(prompt, all_fields)

    parsed = parse_key_value(raw_output, all_fields)

    core, dynamic, missing = apply_schema(parsed, core_fields)

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