import os
import torch
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from backend.api.deps import require_role
from federated.client.client import train_local_api
from backend.services.federated_service import update_global_model

router = APIRouter(prefix="/org", tags=["Organization"])


@router.post("/train")
def train_local(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]

    weights = train_local_api(org_id)

    if weights is None:
        return {"message": "No dataset found. Upload data first."}

    # ✅ CREATE DIRECTORY FIRST (FIX)
    org_path = f"backend/storage/org_{org_id}"
    os.makedirs(org_path, exist_ok=True)

    path = f"{org_path}/local_model.pth"

    torch.save(weights, path)

    print(f"✅ org_{org_id} local model saved")

    # 🔥 AUTO GLOBAL UPDATE
    update_global_model()

    return {
        "message": f"Org {org_id} trained successfully",
        "global_model_updated": True
    }


@router.get("/download-model")
def download_model(user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]

    path = f"backend/storage/org_{org_id}/local_model.pth"

    return FileResponse(path, filename="local_model.pth")