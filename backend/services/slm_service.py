from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
import re

from backend.models.schema_model import SchemaConfig
from backend.services.parser import parse_key_value

# 🔥 NEW IMPORT (Federated dataset saving)
from backend.services.local_dataset_service import save_record

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
            torch_dtype=torch.float32
        )

        print("✅ TinyLlama loaded successfully")


# =========================
# DETECT DOC TYPE (FALLBACK)
# =========================
def detect_doc_type(text):
    text = text.lower()

    if "contract" in text:
        return "employment_contract"

    if "invoice" in text:
        return "invoice"

    if "prescription" in text:
        return "medical"

    return "general"


# =========================
# FETCH SCHEMA
# =========================
def get_schema(db, doc_type):
    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        return None

    return {
        "core_fields": json.loads(schema.core_fields),
        "dynamic_fields": json.loads(schema.dynamic_fields)
        if schema.dynamic_fields else []
    }


# =========================
# BUILD PROMPT (FINAL)
# =========================
def build_prompt(text, fields):

    format_example = "\n".join([f"{f}:" for f in fields])

    return f"""
You are a strict information extraction system.

Extract the following fields from the text.

Fields:
{', '.join(fields)}

Return output EXACTLY in this format:

{format_example}

Rules:
- Write real values after each field
- DO NOT write placeholders like <value>
- If not found, leave empty after colon
- Do NOT explain anything
- Do NOT repeat input text

Text:
{text}

Answer:
"""


# =========================
# CLEAN OUTPUT
# =========================
def clean_output(output, fields):
    lines = output.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        if ":" in line:
            key = line.split(":")[0].strip().lower()

            if key in fields and "<value>" not in line:
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
        max_new_tokens=120,
        temperature=0.0,
        do_sample=False
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🧠 RAW OUTPUT:\n", result)

    cleaned = clean_output(result, fields)

    print("\n✅ CLEANED OUTPUT:\n", cleaned)

    return cleaned


# =========================
# APPLY SCHEMA
# =========================
def apply_schema(parsed, core_fields, dynamic_fields):
    core = {}
    dynamic = {}

    for field in core_fields:
        core[field] = parsed.get(field, "")

    for field in dynamic_fields:
        dynamic[field] = parsed.get(field, "")

    return core, dynamic


# =========================
# 🔥 FINAL FALLBACK (FIXED REGEX)
# =========================
def fallback_extraction(text, core, dynamic):

    # Employee
    if "employee_name" in core and not core["employee_name"]:
        match = re.search(r'employee\s+([A-Z][a-z]+\s[A-Z][a-z]+)', text)
        if match:
            core["employee_name"] = match.group(1)

    # Employer
    if "employer_name" in core and not core.get("employer_name"):
        match = re.search(r'between\s+(.+?)\s+and', text)
        if match:
            core["employer_name"] = match.group(1).strip()

    # Job Role
    if "job_role" in dynamic and not dynamic.get("job_role"):
        match = re.search(r'work as (?:a|an)?\s*([A-Za-z\s]+?)(?:\.|,|$)', text)
        if match:
            dynamic["job_role"] = match.group(1).strip()

    # Start Date
    if "start_date" in dynamic and not dynamic.get("start_date"):
        match = re.search(r'starts? from\s+([A-Za-z0-9\s]+?)(?:\.|,|$)', text)
        if match:
            dynamic["start_date"] = match.group(1).strip()

    return core, dynamic


# =========================
# MAIN PIPELINE
# =========================
def process_text(text, db, doc_type=None):

    if not doc_type:
        doc_type = detect_doc_type(text)

    schema = get_schema(db, doc_type)

    if not schema:
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

    core_fields = schema["core_fields"]
    dynamic_fields = schema["dynamic_fields"]

    all_fields = core_fields + dynamic_fields

    print("📌 Fields used:", all_fields)
    print("📌 TEXT:", text)

    # Run model
    prompt = build_prompt(text, all_fields)
    raw_output = run_model(prompt, all_fields)

    parsed = parse_key_value(raw_output, all_fields)

    core, dynamic = apply_schema(parsed, core_fields, dynamic_fields)

    # 🔥 Apply fallback
    core, dynamic = fallback_extraction(text, core, dynamic)

    # Missing fields calculation
    missing = []

    for k, v in core.items():
        if not v:
            missing.append(k)

    for k, v in dynamic.items():
        if not v:
            missing.append(k)

    # =========================
    # 🔥 FINAL RESULT
    # =========================
    result = {
        "doc_type": doc_type,
        "core_fields": core,
        "dynamic_fields": dynamic,
        "metadata": {
            "missing_fields": missing,
            "imputed": len(missing) > 0
        },
        "raw_output": raw_output
    }

    # =========================
    # 🔥 NEW: SAVE FOR FEDERATED LEARNING
    # =========================
    save_record(result)

    return result