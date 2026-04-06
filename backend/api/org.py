import os
import torch
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from backend.api.deps import require_role
from federated.client.client import train_local_api
from backend.services.federated_service import update_global_model
from backend.services.blockchain_service import log_action

router = APIRouter(prefix="/org", tags=["Organization"])


# 🔥 TRAIN
@router.post("/train")
def train_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]

    weights = train_local_api(org_id)

    if weights is None:
        return {"message": "No dataset found"}

    org_path = f"backend/storage/org_{org_id}"
    os.makedirs(org_path, exist_ok=True)

    path = f"{org_path}/local_model.pth"
    torch.save(weights, path)

    print(f"✅ org_{org_id} model saved")

    # 🔥 BLOCKCHAIN LOG
    log_action(
        org_id=org_id,
        action="LOCAL_TRAINING_DONE"
    )

    update_global_model()

    return {"message": "Training done & global updated"}


# ✅ LOCAL MODEL
@router.get("/download-model")
def download_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    path = f"backend/storage/org_{org_id}/local_model.pth"

    # 🔥 BLOCKCHAIN LOG
    log_action(
        org_id=org_id,
        action="LOCAL_MODEL_DOWNLOADED"
    )

    return FileResponse(path, filename="local_model.pth")


# 🔒 GLOBAL MODEL
@router.get("/global-model")
def download_global(user=Depends(require_role(["ORG", "RESEARCHER", "ADMIN"]))):

    if user["role"] != "ADMIN" and not user.get("can_download_global"):
        raise HTTPException(status_code=403, detail="Admin approval required")

    # 🔥 BLOCKCHAIN LOG
    log_action(
        org_id=user.get("org_id", 0),
        action="GLOBAL_MODEL_DOWNLOADED"
    )

    return FileResponse("backend/storage/global_model.pth")