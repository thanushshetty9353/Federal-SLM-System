import os
import torch
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from backend.api.deps import require_role
from federated.client.client import train_local_api
from backend.services.federated_service import update_global_model
from backend.services.blockchain_service import log_action
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.user_model import User
from backend.models.job_model import TrainingJob, OrgJob

router = APIRouter(prefix="/org", tags=["Organization"])


# =========================
# 🔥 JOBS AND ACCESS
# =========================
@router.get("/jobs")
def get_jobs(db: Session = Depends(get_db), user=Depends(require_role(["ORG"]))):
    jobs = db.query(TrainingJob).all()
    org_id = user["org_id"]
    joined = db.query(OrgJob).filter(OrgJob.org_id == org_id).all()
    joined_dict = {j.job_id: j.status for j in joined}
    
    res = []
    for j in jobs:
        res.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "status": j.status,
            "org_status": joined_dict.get(j.id, "NOT_JOINED")
        })
    return res


@router.post("/jobs/{job_id}/join")
def join_job(job_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    existing = db.query(OrgJob).filter(OrgJob.org_id == org_id, OrgJob.job_id == job_id).first()
    if existing:
        return {"message": "Already joined"}
    
    new_join = OrgJob(job_id=job_id, org_id=org_id, status="JOINED")
    db.add(new_join)
    db.commit()
    return {"message": "Successfully joined job"}


@router.post("/request-global-access")
def request_global_access(db: Session = Depends(get_db), user=Depends(require_role(["ORG", "RESEARCHER"]))):
    u = db.query(User).get(user["user_id"])
    if u.can_download_global:
        return {"message": "Already have access"}
    u.global_request_status = "PENDING"
    db.commit()
    return {"message": "Access requested"}


# =========================
# 🔥 TRAIN
# =========================
@router.post("/train/{job_id}")
def train_local(job_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    
    # Check if joined
    oj = db.query(OrgJob).filter(OrgJob.org_id == org_id, OrgJob.job_id == job_id).first()
    if not oj:
        raise HTTPException(status_code=403, detail="Must join job before training")

    weights = train_local_api(org_id)

    if weights is None:
        return {"message": "No dataset found"}

    org_path = f"backend/storage/org_{org_id}"
    os.makedirs(org_path, exist_ok=True)

    local_model_path = f"{org_path}/local_model_job_{job_id}.pth"

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
            details=f"Local model trained for org_{org_id} on job_{job_id}"
        )
    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")

    # =========================
    # 🔥 INCREMENTAL GLOBAL UPDATE
    # =========================
    update_global_model(org_id, job_id)
    
    oj.status = "TRAINED"
    db.commit()

    return {"message": f"Training done & global model updated incrementally for job {job_id}"}

# =========================
# ✅ LOCAL MODEL DOWNLOAD
# =========================
@router.get("/download-model/{job_id}")
def download_local(job_id: int, user=Depends(require_role(["ORG"]))):
    org_id = user["org_id"]
    path = f"backend/storage/org_{org_id}/local_model_job_{job_id}.pth"

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

    return FileResponse(path, filename=f"local_model_job_{job_id}.pth")

# =========================
# 🔒 GLOBAL MODEL DOWNLOAD
# =========================
@router.get("/global-model/{job_id}")
def download_global(job_id: int, user=Depends(require_role(["ORG", "RESEARCHER", "ADMIN"]))):

    global_model_path = f"backend/storage/global_model_job_{job_id}.pth"

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

    return FileResponse(global_model_path, filename=f"global_model_job_{job_id}.pth")