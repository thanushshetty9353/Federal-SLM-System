import json
import re

from sqlalchemy.orm import Session
from langchain_core.prompts import PromptTemplate

from backend.models.schema_model import SchemaConfig
from backend.services.ollama_service import generate_response
from backend.services.prompt_service import build_prompt


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
# SMART NUMERIC PARSER
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
# MAIN SLM FUNCTION
# =========================
def process_text(
    text,
    db: Session = None,
    doc_type="cancer"
):

    print("\n🚀 USING OLLAMA + LANGCHAIN")

    cleaned_text = clean_text(text)

    print("\n📄 CLEANED TEXT:\n", cleaned_text)

    # ===================================
    # STEP 1 — TRY NUMERIC EXTRACTION
    # ===================================

    records = extract_numeric_records(cleaned_text)

    if records:

        print("\n✅ Parsed using numeric extraction")

        return records

    # ===================================
    # STEP 2 — FETCH SCHEMA
    # ===================================

    schema = get_schema(db, doc_type) if db else None

    if not schema:

        print("⚠️ No schema found")

        return [{
            "raw_text": cleaned_text[:300]
        }]

    fields = list(schema.keys())

    # ===================================
    # STEP 3 — BUILD PROMPT
    # ===================================

    prompt_template = build_prompt(
        fields=fields,
        text=cleaned_text
    )

    template = PromptTemplate(
        input_variables=[],
        template=prompt_template
    )

    final_prompt = template.format()

    print("\n🧠 FINAL PROMPT:\n", final_prompt)

    # ===================================
    # STEP 4 — OLLAMA INFERENCE
    # ===================================

    try:

        response = generate_response(final_prompt)

        print("\n🤖 OLLAMA RESPONSE:\n", response)

        # ===================================
        # STEP 5 — EXTRACT JSON
        # ===================================

        start = response.find("[")
        end = response.rfind("]")

        if start != -1 and end != -1:

            json_output = response[start:end + 1]

            return json.loads(json_output)

        # fallback object
        start = response.find("{")
        end = response.rfind("}")

        if start != -1 and end != -1:

            json_output = response[start:end + 1]

            return json.loads(json_output)

    except Exception as e:

        print("\n❌ OLLAMA ERROR:", e)

    return []