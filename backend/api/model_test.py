import os
import uuid
import json
import pickle
import joblib
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional

from backend.models.database import get_db
from backend.models.model_test_db import TestModel
from backend.api.deps import require_role

router = APIRouter(prefix="/models", tags=["Model Testing"])

STORAGE_DIR = Path("backend/storage/test_models")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pkl", ".joblib", ".pt", ".pth", ".onnx"}


# ─────────────────────────────────────────
#  UPLOAD MODEL
# ─────────────────────────────────────────
@router.post("/upload")
async def upload_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    schema_doc_type: str = Form(default=""),
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN", "ORG", "RESEARCHER"])),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = STORAGE_DIR / unique_name

    contents = await file.read()
    with open(dest, "wb") as f:
        f.write(contents)

    record = TestModel(
        name=name.strip() or file.filename,
        filename=unique_name,
        original_filename=file.filename,
        format=ext.lstrip("."),
        schema_doc_type=schema_doc_type or None,
        uploaded_by=user.get("user_id") if isinstance(user, dict) else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "name": record.name,
        "format": record.format,
        "original_filename": record.original_filename,
        "schema_doc_type": record.schema_doc_type,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


# ─────────────────────────────────────────
#  LIST MODELS
# ─────────────────────────────────────────
@router.get("/")
def list_models(
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN", "ORG", "RESEARCHER"])),
):
    models = db.query(TestModel).order_by(TestModel.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "format": m.format,
            "original_filename": m.original_filename,
            "schema_doc_type": m.schema_doc_type,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in models
    ]


# ─────────────────────────────────────────
#  DELETE MODEL
# ─────────────────────────────────────────
@router.delete("/{model_id}")
def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN", "ORG", "RESEARCHER"])),
):
    record = db.query(TestModel).filter(TestModel.id == model_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Model not found")

    file_path = STORAGE_DIR / record.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(record)
    db.commit()
    return {"message": "Model deleted successfully"}


# ─────────────────────────────────────────
#  PREDICT
# ─────────────────────────────────────────
class PredictRequest(BaseModel):
    model_id: int
    schema_id: Optional[str] = None   # doc_type string
    target_field: str
    features: Dict[str, Any]


def _load_and_predict(filepath: Path, fmt: str, features: Dict[str, Any]):
    """Load model and run prediction. Returns (prediction_label, confidence)."""
    import numpy as np

    feature_values = list(features.values())
    X = np.array([feature_values], dtype=float)

    if fmt in ("pkl", "pickle"):
        with open(filepath, "rb") as f:
            model = pickle.load(f)

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            pred_idx = int(np.argmax(proba))
            confidence = float(proba[pred_idx])
            # Use class label if available
            if hasattr(model, "classes_"):
                prediction = str(model.classes_[pred_idx])
            else:
                prediction = str(pred_idx)
        else:
            raw = model.predict(X)[0]
            prediction = str(raw)
            confidence = 1.0
        return prediction, confidence

    elif fmt == "joblib":
        model = joblib.load(filepath)

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            pred_idx = int(np.argmax(proba))
            confidence = float(proba[pred_idx])
            if hasattr(model, "classes_"):
                prediction = str(model.classes_[pred_idx])
            else:
                prediction = str(pred_idx)
        else:
            raw = model.predict(X)[0]
            prediction = str(raw)
            confidence = 1.0
        return prediction, confidence

    elif fmt in ("pt", "pth"):
        try:
            import torch
            import torch.nn as nn
            from collections import OrderedDict

            # Load the file
            try:
                loaded = torch.load(filepath, map_location="cpu", weights_only=False)
            except TypeError:
                loaded = torch.load(filepath, map_location="cpu")

            model = None

            # ─── CASE A: It's already a full model object ───
            if isinstance(loaded, nn.Module):
                model = loaded

            # ─── CASE B: It's a state_dict (OrderedDict or dict) ───
            elif isinstance(loaded, (dict, OrderedDict)):
                # Try to infer architecture from state_dict keys/shapes
                # The project's SimpleModel uses 'fc.weight' and 'fc.bias'
                if 'fc.weight' in loaded:
                    weight = loaded['fc.weight']
                    out_features, in_features = weight.shape
                    
                    # Verify input size matches our features
                    if in_features != len(features):
                        raise HTTPException(
                            status_code=422,
                            detail=f"Model expects {in_features} features, but schema/inputs provide {len(features)}."
                        )

                    # Build a compatible architecture
                    class DynamicSimpleModel(nn.Module):
                        def __init__(self, inf, outf):
                            super().__init__()
                            self.fc = nn.Linear(inf, outf)
                        def forward(self, x):
                            return self.fc(x)

                    model = DynamicSimpleModel(in_features, out_features)
                    model.load_state_dict(loaded)
                else:
                    # Generic fallback: if it's just a dict but doesn't match our pattern
                    raise HTTPException(
                        status_code=422,
                        detail="The file contains a state_dict but the architecture is unknown. "
                               "Save the full model using torch.save(model, path) for the testing tool to work."
                    )
            
            if not model:
                raise HTTPException(status_code=422, detail="Unsupported PyTorch file content.")

            model.eval()
            tensor = torch.tensor(X, dtype=torch.float32)
            with torch.no_grad():
                output = model(tensor)

            # Multi-class: use softmax
            if output.dim() > 1 and output.shape[-1] > 1:
                probs = torch.softmax(output, dim=-1)[0]
                pred_idx = int(torch.argmax(probs).item())
                confidence = float(probs[pred_idx].item())
            else:
                # Binary / single output
                prob = float(torch.sigmoid(output.squeeze()).item())
                pred_idx = 1 if prob >= 0.5 else 0
                confidence = prob if pred_idx == 1 else 1 - prob

            return str(pred_idx), confidence

        except HTTPException:
            raise
        except ImportError:
            raise HTTPException(status_code=500, detail="PyTorch not installed on server.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PyTorch inference error: {str(e)}")

    elif fmt == "onnx":
        try:
            import onnxruntime as ort
            import numpy as np
            sess = ort.InferenceSession(str(filepath))
            input_name = sess.get_inputs()[0].name
            result = sess.run(None, {input_name: X.astype(np.float32)})
            prediction = str(result[0][0])
            # Try to get probabilities from second output
            confidence = 1.0
            if len(result) > 1:
                probs = result[1]
                if hasattr(probs, "__iter__"):
                    flat = list(probs[0].values()) if isinstance(probs[0], dict) else list(probs[0])
                    confidence = float(max(flat))
            return prediction, confidence
        except ImportError:
            raise HTTPException(status_code=500, detail="onnxruntime not installed on server.")

    raise HTTPException(status_code=400, detail=f"Unsupported model format: {fmt}")


@router.post("/predict")
def predict(
    request: PredictRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN", "ORG", "RESEARCHER"])),
):
    record = db.query(TestModel).filter(TestModel.id == request.model_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Model not found")

    filepath = STORAGE_DIR / record.filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Model file missing on server")

    if not request.features:
        raise HTTPException(status_code=400, detail="No features provided")

    try:
        prediction, confidence = _load_and_predict(filepath, record.format, request.features)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "model_name": record.name,
        "model_format": record.format,
        "target_field": request.target_field,
    }
