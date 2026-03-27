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
# 🔥 IMPROVED PROMPT
# =========================
def build_prompt(text, fields):

    return f"""
You are an expert medical data extraction AI.

Your task is to extract ALL patient records from the given text.

Each row corresponds to ONE patient.

Fields:
{fields}

Return ONLY valid JSON ARRAY.

Example:
[
  {{"id": "1", "name": "Ravi", "age": "52", "tumor_size": "3.2", "cancer": "1"}},
  {{"id": "2", "name": "Asha", "age": "45", "tumor_size": "1.8", "cancer": "1"}}
]

STRICT RULES:
- Output MUST be valid JSON
- NO explanation
- NO extra text
- Extract ALL rows
- If value missing, use ""
- Do NOT skip any records

TEXT:
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
        max_new_tokens=512,            # 🔥 increased
        temperature=0.0,
        do_sample=False,
        repetition_penalty=1.1         # 🔥 stabilizes output
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    print("\n📄 PROMPT:\n", prompt)
    print("\n🧠 RAW MODEL OUTPUT:\n", result)

    return result


# =========================
# 🔥 ROBUST JSON EXTRACTION
# =========================
def extract_json(text):
    try:
        # Find JSON array manually
        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1:
            json_str = text[start:end + 1]

            # Fix common issues
            json_str = json_str.replace("\n", " ")
            json_str = json_str.replace("'", '"')

            # Remove trailing commas (common LLM issue)
            json_str = re.sub(r",\s*}", "}", json_str)
            json_str = re.sub(r",\s*]", "]", json_str)

            parsed = json.loads(json_str)

            print("\n📦 PARSED RECORDS:\n", parsed)

            return parsed

    except Exception as e:
        print("\n❌ JSON PARSE ERROR:", e)

    return []


# =========================
# MAIN FUNCTION
# =========================
def process_text(text, db, doc_type="cancer"):

    print("\n🚀 STARTING SLM PROCESSING")

    # 🔥 FORCE doc_type (important for now)
    doc_type = "cancer"

    schema = get_schema(db, doc_type)

    if not schema:
        print("❌ No schema found for doc_type:", doc_type)
        return []

    fields = list(schema.keys())

    print("📌 FIELDS:", fields)
    print("\n📄 OCR TEXT:\n", text)

    prompt = build_prompt(text, fields)

    raw_output = run_model(prompt)

    records = extract_json(raw_output)

    if not records:
        print("⚠️ WARNING: SLM returned empty records")

    return records