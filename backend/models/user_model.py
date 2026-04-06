from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from backend.models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(String, nullable=False)  # ADMIN / ORG / RESEARCHER

    org_id = Column(Integer, nullable=True)

    is_approved = Column(Boolean, default=False)

    # 🔥 ONLY FOR GLOBAL MODEL ACCESS
    can_download_global = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"