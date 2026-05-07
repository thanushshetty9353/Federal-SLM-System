import json

from backend.models.schema_model import SchemaConfig


def get_schema_features(db, doc_type):

    schema = db.query(SchemaConfig).filter(
        SchemaConfig.doc_type == doc_type
    ).first()

    if not schema:
        raise Exception("Schema not found")

    core_fields = json.loads(schema.core_fields)

    feature_fields = []

    target_field = None

    for field, dtype in core_fields.items():

        if dtype == "target":
            target_field = field
        else:
            feature_fields.append(field)

    if not target_field:
        raise Exception("Target field missing in schema")

    return {
        "features": feature_fields,
        "target": target_field
    }