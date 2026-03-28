from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.models.database import get_db
from backend.models.user_model import User
from backend.services.auth_service import hash_password, verify_password, create_token

router = APIRouter()

# =========================
# REQUEST SCHEMAS
# =========================

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str   # ADMIN / ORG / RESEARCHER
    org_id: int | None = None  # Only for ORG users


class LoginRequest(BaseModel):
    email: str
    password: str


# =========================
# REGISTER
# =========================

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # 🔐 Validate role
    if data.role not in ["ORG", "RESEARCHER"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # ❌ Prevent duplicate users
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🔐 ORG must have org_id
    if data.role == "ORG" and not data.org_id:
        raise HTTPException(status_code=400, detail="org_id required for ORG")

    new_user = User(
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        org_id=data.org_id if data.role == "ORG" else None,
        is_approved=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registered successfully. Waiting for admin approval",
        "user_id": new_user.id
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    # ❌ Invalid credentials
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ❌ Not approved
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Approval pending")

    # 🔥 INCLUDE org_id IN TOKEN (VERY IMPORTANT)
    token = create_token({
        "user_id": user.id,
        "role": user.role,
        "org_id": user.org_id  # ✅ THIS IS THE KEY
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }