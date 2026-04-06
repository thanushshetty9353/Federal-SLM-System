import os
import torch
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from backend.api.deps import require_role
from federated.client.client import train_local_api
from backend.services.federated_service import update_global_model

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

    update_global_model()

    return {"message": "Training done & global updated"}


# ✅ LOCAL MODEL (FREE ACCESS)
@router.get("/download-model")
def download_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    path = f"backend/storage/org_{org_id}/local_model.pth"

    return FileResponse(path, filename="local_model.pth")


# 🔒 GLOBAL MODEL (RESTRICTED)
@router.get("/global-model")
def download_global(user=Depends(require_role(["ORG", "RESEARCHER", "ADMIN"]))):

    # ADMIN always allowed
    if user["role"] == "ADMIN":
        return FileResponse("backend/storage/global_model.pth")

    # Others need approval
    if not user.get("can_download_global"):
        raise HTTPException(
            status_code=403,
            detail="Admin approval required for global model"
        )

    return FileResponse("backend/storage/global_model.pth")