from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from backend.models.database import get_db
from backend.models.user_model import User
from backend.services.auth_service import hash_password, verify_password, create_token

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str
    org_id: int | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    if data.role not in ["ORG", "RESEARCHER"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    if data.role == "ORG":
        max_org = db.query(func.max(User.org_id)).scalar()
        data.org_id = (max_org or 0) + 1

    new_user = User(
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        org_id=data.org_id if data.role == "ORG" else None,
        is_approved=False,
        can_download_global=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registered. Wait for admin approval"}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Approval pending")

    token = create_token({
        "user_id": user.id,
        "role": user.role,
        "org_id": user.org_id,
        "can_download_global": user.can_download_global
    })

    return {"access_token": token}