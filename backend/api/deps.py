from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 🔥 NEW SECURITY
security = HTTPBearer()

SECRET_KEY = "secret"
ALGORITHM = "HS256"


# =========================
# GET CURRENT USER
# =========================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials  # Extract token from Bearer

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("user_id")
        role = payload.get("role")
        org_id = payload.get("org_id")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        return {
            "user_id": user_id,
            "role": role,
            "org_id": org_id
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# =========================
# ROLE CHECKER
# =========================
def require_role(roles: list):
    def checker(user=Depends(get_current_user)):
        user_role = str(user.get("role", "")).upper()
        allowed_roles = [r.upper() for r in roles]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{user.get('role')}' not in {roles}."
            )
        return user

    return checker