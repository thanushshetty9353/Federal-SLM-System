import json
import os
import re
from dotenv import load_dotenv
from groq import Groq
from backend.models.schema_model import SchemaConfig

load_dotenv(dotenv_path=".env")

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
# CLEAN TEXT
# =========================
def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


# =========================
# 🔥 SMART NUMBER PARSER
# =========================
def extract_numeric_records(text):
    numbers = re.findall(r"\d+\.\d+|\d+", text)

    print("\n🔢 EXTRACTED NUMBERS:", numbers)

    if len(numbers) < 6:
        return []

    records = []
    row_size = 6

    for i in range(0, len(numbers), row_size):
        row = numbers[i:i + row_size]

        if len(row) != row_size:
            continue

        try:
            record = {
                "id": int(float(row[0])),
                "label": int(float(row[1])),
                "radius_mean": float(row[2]),
                "texture_mean": float(row[3]),
                "perimeter_mean": float(row[4]),
                "area_mean": float(row[5]),
            }
            records.append(record)
        except Exception:
            continue

    return records


# =========================
# MAIN FUNCTION
# =========================
def process_text(text, db, doc_type="cancer"):
    print("\n🚀 USING SMART SLM")

    cleaned_text = clean_text(text)

    print("\n📄 CLEAN TEXT:\n", cleaned_text)

    # 🔥 STEP 1: TRY NUMERIC PARSING
    records = extract_numeric_records(cleaned_text)

    if records:
        print("\n✅ Parsed using numeric extraction")
        return records

    # 🔥 STEP 2: FALLBACK TO GROQ
    schema = get_schema(db, doc_type)

    if not schema:
        print("⚠️ No schema found → returning raw text")
        return [{"raw_text": cleaned_text[:200]}]

    fields = list(schema.keys())

    prompt = f"""
Extract structured data.

Fields: {fields}

Return JSON array only.

TEXT:
{cleaned_text}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        output = response.choices[0].message.content

        print("\n🧠 GROQ OUTPUT:\n", output)

        start = output.find("[")
        end = output.rfind("]")

        if start != -1 and end != -1:
            return json.loads(output[start:end + 1])

    except Exception as e:
        print("❌ GROQ ERROR:", e)

    return []