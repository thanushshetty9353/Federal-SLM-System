import os
import torch
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from backend.api.deps import require_role
from federated.client.client import train_local_api
from backend.services.federated_service import update_global_model
from backend.services.blockchain_service import log_action

router = APIRouter(prefix="/org", tags=["Organization"])


# =========================
# 🔥 TRAIN
# =========================
@router.post("/train")
def train_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]

    weights = train_local_api(org_id)

    if weights is None:
        return {"message": "No dataset found"}

    org_path = f"backend/storage/org_{org_id}"
    os.makedirs(org_path, exist_ok=True)

    local_model_path = f"{org_path}/local_model.pth"

    try:
        torch.save(weights, local_model_path)
        print(f"✅ org_{org_id} local model saved")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save local model: {e}")

    # =========================
    # 🔗 BLOCKCHAIN LOG
    # =========================
    try:
        log_action(
            org_id=org_id,
            action="LOCAL_TRAINING_DONE",
            details=f"Local model trained for org_{org_id}"
        )
    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")

    # =========================
    # 🔥 INCREMENTAL GLOBAL UPDATE
    # =========================
    update_global_model(org_id)

    return {"message": "Training done & global model updated incrementally"}


# =========================
# ✅ LOCAL MODEL DOWNLOAD
# =========================
@router.get("/download-model")
def download_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    path = f"backend/storage/org_{org_id}/local_model.pth"

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Local model not found")

    # 🔗 BLOCKCHAIN LOG
    try:
        log_action(
            org_id=org_id,
            action="LOCAL_MODEL_DOWNLOADED"
        )
    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")

    return FileResponse(path, filename="local_model.pth")


# =========================
# 🔒 GLOBAL MODEL DOWNLOAD
# =========================
@router.get("/global-model")
def download_global(user=Depends(require_role(["ORG", "RESEARCHER", "ADMIN"]))):

    global_model_path = "backend/storage/global_model.pth"

    if not os.path.exists(global_model_path):
        raise HTTPException(status_code=404, detail="Global model not found")

    if user["role"] != "ADMIN" and not user.get("can_download_global"):
        raise HTTPException(status_code=403, detail="Admin approval required")

    # 🔗 BLOCKCHAIN LOG
    try:
        log_action(
            org_id=user.get("org_id", 0),
            action="GLOBAL_MODEL_DOWNLOADED"
        )
    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")

    return FileResponse(global_model_path, filename="global_model.pth")