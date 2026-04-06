import json
import os
import re

# =========================
# LOAD ENV
# =========================
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")

from groq import Groq
from backend.models.schema_model import SchemaConfig


# =========================
# INIT GROQ CLIENT
# =========================
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("❌ GROQ_API_KEY not found")

client = Groq(api_key=api_key)


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
# CLEAN OCR TEXT
# =========================
def clean_text(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# =========================
# 🔥 SMART STRUCTURING (ORDER-INDEPENDENT)
# =========================
def structure_text_dynamic(text):

    tokens = text.split()

    # detect header
    header = []
    for token in tokens:
        if re.match(r"[a-zA-Z_]+", token):
            header.append(token)
        else:
            break

    if not header:
        print("⚠️ No header detected")
        return text

    print("📌 DETECTED HEADER:", header)

    data = tokens[len(header):]

    records = []

    for i in range(0, len(data), len(header)):
        row = data[i:i + len(header)]

        if len(row) != len(header):
            continue

        record_parts = []

        for col, val in zip(header, row):
            record_parts.append(f"{col}: {val}")

        records.append(", ".join(record_parts))

    structured = "\n".join(records)

    print("\n🧾 STRUCTURED TEXT:\n", structured)

    return structured


# =========================
# 🔥 BUILD PROMPT (OCR CORRECTION ENABLED)
# =========================
def build_prompt(text, fields):

    return f"""
You are an expert medical data extraction AI.

The OCR text may contain errors (for example: 4l'67 instead of 19.17).

Your job:
- Correct OCR mistakes intelligently
- Extract accurate structured data

Fields:
{fields}

Return ONLY JSON ARRAY.

Example:
[
  {{"id":"842302","label":"1","radius_mean":"17.99"}}
]

Rules:
- Each line = one record
- Fix OCR errors (l→1, '→.)
- Ensure numbers are valid floats
- Extract ALL records
- Ignore extra fields
- If missing → ""
- NO explanation
- ONLY JSON output

TEXT:
{text}
"""


# =========================
# CALL GROQ
# =========================
def call_groq(prompt):

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You output only JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    return response.choices[0].message.content


# =========================
# PARSE JSON (SAFE)
# =========================
def extract_json(text):
    try:
        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1:
            json_str = text[start:end + 1]

            # clean formatting issues only
            json_str = json_str.replace("\n", " ")
            json_str = json_str.replace("'", '"')

            json_str = re.sub(r",\s*}", "}", json_str)
            json_str = re.sub(r",\s*]", "]", json_str)

            print("\n🧹 CLEAN JSON:\n", json_str)

            return json.loads(json_str)

    except Exception as e:
        print("❌ JSON ERROR:", e)

    return []


# =========================
# MAIN FUNCTION
# =========================
def process_text(text, db, doc_type="cancer"):

    print("\n🚀 USING GROQ SLM")

    schema = get_schema(db, doc_type)

    if not schema:
        print("❌ No schema found")
        return []

    fields = list(schema.keys())

    # Step 1: Clean OCR
    cleaned_text = clean_text(text)

    print("\n📄 OCR TEXT:\n", cleaned_text)

    # Step 2: Structure dynamically
    structured_text = structure_text_dynamic(cleaned_text)

    # Step 3: Build prompt
    prompt = build_prompt(structured_text, fields)

    try:
        raw_output = call_groq(prompt)

        print("\n🧠 MODEL OUTPUT:\n", raw_output)

        # Step 4: Parse JSON
        records = extract_json(raw_output)

        print("\n📦 PARSED RECORDS:\n", records)

        return records

    except Exception as e:
        print("❌ GROQ ERROR:", e)
        return []