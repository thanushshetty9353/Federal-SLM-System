from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
import re

from backend.models.schema_model import SchemaConfig

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
# FETCH SCHEMA
# =========================
def get_schema(db, doc_type):
    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        return None

    return json.loads(schema.core_fields)


# =========================
# 🔥 NEW PROMPT (MULTI RECORD)
# =========================
def build_prompt(text, fields):

    return f"""
Extract ALL records from the text.

Fields:
{fields}

Return ONLY JSON ARRAY format like:

[
  {{"field1": "", "field2": ""}},
  {{"field1": "", "field2": ""}}
]

Rules:
- Extract multiple records
- Each row = one record
- No explanation
- Only JSON array

Text:
{text}
"""


# =========================
# RUN MODEL
# =========================
def run_model(prompt):
    load_model()

    inputs = tokenizer(prompt, return_tensors="pt")

    outputs = model.generate(
        **inputs,
        max_new_tokens=300,
        temperature=0.0,
        do_sample=False
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n🧠 RAW OUTPUT:\n", result)

    return result


# =========================
# PARSE JSON OUTPUT
# =========================
def extract_json(text):
    try:
        json_part = re.search(r"\[.*\]", text, re.DOTALL)
        if json_part:
            return json.loads(json_part.group())
    except:
        pass

    return []


# =========================
# MAIN FUNCTION
# =========================
def process_text(text, db, doc_type="cancer"):

    schema = get_schema(db, doc_type)

    if not schema:
        return []

    fields = list(schema.keys())

    prompt = build_prompt(text, fields)

    raw_output = run_model(prompt)

    records = extract_json(raw_output)

    return records