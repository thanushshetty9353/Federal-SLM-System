from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "secret"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"])


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)


def create_token(data: dict):
    to_encode = data.copy()  # ✅ safer
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=10)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)