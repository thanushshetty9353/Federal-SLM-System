from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from backend.models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(String, nullable=False)

    org_id = Column(Integer, nullable=True)

    is_approved = Column(Boolean, default=False)

    # 🔥 NEW FIELD (IMPORTANT)
    can_download_model = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def is_admin(self):
        return self.role == "ADMIN"

    def is_org(self):
        return self.role == "ORG"

    def is_researcher(self):
        return self.role == "RESEARCHER"

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"