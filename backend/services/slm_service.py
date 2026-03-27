import json
import os
import re

# 🔥 LOAD ENV FIRST (VERY IMPORTANT)
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")

from groq import Groq
from backend.models.schema_model import SchemaConfig


# =========================
# INIT GROQ CLIENT
# =========================
api_key = os.getenv("GROQ_API_KEY")

print("🔑 GROQ API KEY:", api_key)  # 🔥 DEBUG

if not api_key:
    raise ValueError("❌ GROQ_API_KEY not found. Check your .env file")

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
# BUILD PROMPT
# =========================
def build_prompt(text, fields):

    return f"""
You are an expert medical data extraction system.

Extract ALL records from the OCR text.

Each row corresponds to ONE patient.

Fields:
{fields}

Return ONLY JSON ARRAY.

Example:
[
  {{"id":"1","name":"Ravi","age":"52","tumor_size":"3.2","cancer":"1"}},
  {{"id":"2","name":"Asha","age":"45","tumor_size":"1.8","cancer":"1"}}
]

STRICT RULES:
- Output MUST be valid JSON
- NO explanation
- NO extra text
- Extract ALL rows
- If value missing → ""
- Do NOT skip records

TEXT:
{text}
"""


# =========================
# CALL GROQ MODEL
# =========================
def call_groq(prompt):

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You extract structured data into JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    return response.choices[0].message.content


# =========================
# PARSE JSON (ROBUST)
# =========================
def extract_json(text):
    try:
        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1:
            json_str = text[start:end + 1]

            # 🔥 Fix common LLM issues
            json_str = json_str.replace("\n", " ")
            json_str = json_str.replace("'", '"')

            # Remove trailing commas
            json_str = re.sub(r",\s*}", "}", json_str)
            json_str = re.sub(r",\s*]", "]", json_str)

            parsed = json.loads(json_str)

            return parsed

    except Exception as e:
        print("❌ JSON PARSE ERROR:", e)

    return []


# =========================
# MAIN FUNCTION
# =========================
def process_text(text, db, doc_type="cancer"):

    print("\n🚀 USING GROQ SLM")

    # Force doc_type
    doc_type = "cancer"

    schema = get_schema(db, doc_type)

    if not schema:
        print("❌ No schema found")
        return []

    fields = list(schema.keys())

    # Clean OCR text
    cleaned_text = clean_text(text)

    print("\n📄 OCR TEXT:\n", cleaned_text)

    prompt = build_prompt(cleaned_text, fields)

    try:
        raw_output = call_groq(prompt)

        print("\n🧠 MODEL OUTPUT:\n", raw_output)

        records = extract_json(raw_output)

        print("\n📦 PARSED RECORDS:\n", records)

        return records

    except Exception as e:
        print("❌ GROQ ERROR:", e)
        return []