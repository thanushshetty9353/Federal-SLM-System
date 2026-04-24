from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.user_model import User
from backend.models.job_model import TrainingJob
from backend.api.deps import require_role
from pydantic import BaseModel
import os
from fastapi import HTTPException
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/pending-users")
def pending_users(db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    return db.query(User).filter(User.is_approved == False).all()

@router.get("/all-users")
def all_users(db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    return db.query(User).all()

class JobCreate(BaseModel):
    title: str
    description: str

@router.post("/jobs")
def create_job(data: JobCreate, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    new_job = TrainingJob(title=data.title, description=data.description)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    return db.query(TrainingJob).all()



@router.post("/approve/{user_id}")
def approve(user_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    u = db.query(User).get(user_id)
    u.is_approved = True
    db.commit()
    return {"msg": "Approved"}


@router.post("/reject/{user_id}")
def reject(user_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    u = db.query(User).get(user_id)
    db.delete(u)
    db.commit()
    return {"msg": "Rejected"}


# 🔥 GLOBAL MODEL ACCESS CONTROL
@router.post("/grant-global/{user_id}")
def grant_global(user_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    u = db.query(User).get(user_id)
    u.can_download_global = True
    u.global_request_status = "APPROVED"
    db.commit()
    return {"msg": "Global model access granted"}


@router.post("/revoke-global/{user_id}")
def revoke_global(user_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    u = db.query(User).get(user_id)
    u.can_download_global = False
    u.global_request_status = "REJECTED"
    db.commit()
    return {"msg": "Global model access revoked"}


@router.get("/download-global/{job_id}")
def admin_download_global(job_id: int, user=Depends(require_role(["ADMIN"]))):
    global_model_path = f"backend/storage/global_model_job_{job_id}.pth"
    if not os.path.exists(global_model_path):
        raise HTTPException(status_code=404, detail="Global model not found for this job yet")
    return FileResponse(global_model_path, filename=f"global_model_job_{job_id}.pth")