from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.user_model import User
from backend.api.deps import require_role

router = APIRouter()


@router.get("/pending-users")
def pending_users(
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN"]))
):
    return db.query(User).filter(User.is_approved == False).all()


@router.post("/approve/{user_id}")
def approve(
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN"]))
):
    user_obj = db.query(User).get(user_id)
    user_obj.is_approved = True
    db.commit()
    return {"msg": "Approved"}


@router.post("/reject/{user_id}")
def reject(
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role(["ADMIN"]))
):
    user_obj = db.query(User).get(user_id)
    db.delete(user_obj)
    db.commit()
    return {"msg": "Rejected"}