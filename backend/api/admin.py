from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.user_model import User
from backend.api.deps import require_role

router = APIRouter()


@router.get("/pending-users")
def pending_users(db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    return db.query(User).filter(User.is_approved == False).all()


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
    db.commit()
    return {"msg": "Global model access granted"}


@router.post("/revoke-global/{user_id}")
def revoke_global(user_id: int, db: Session = Depends(get_db), user=Depends(require_role(["ADMIN"]))):
    u = db.query(User).get(user_id)
    u.can_download_global = False
    db.commit()
    return {"msg": "Global model access revoked"}