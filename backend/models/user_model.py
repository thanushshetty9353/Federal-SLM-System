from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from backend.models.database import Base


class User(Base):
    __tablename__ = "users"

    # =========================
    # PRIMARY KEY
    # =========================
    id = Column(Integer, primary_key=True, index=True)

    # =========================
    # BASIC INFO
    # =========================
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    # =========================
    # ROLE MANAGEMENT
    # =========================
    role = Column(String, nullable=False)  
    # Values: ADMIN / ORG / RESEARCHER

    # =========================
    # 🔥 ORG LINK (CRITICAL)
    # =========================
    org_id = Column(Integer, nullable=True)
    # ORG → must have org_id
    # RESEARCHER → None
    # ADMIN → None

    # =========================
    # APPROVAL SYSTEM
    # =========================
    is_approved = Column(Boolean, default=False)

    # =========================
    # TIMESTAMPS (GOOD PRACTICE)
    # =========================
    created_at = Column(DateTime, default=datetime.utcnow)

    # =========================
    # HELPER METHODS (OPTIONAL)
    # =========================
    def is_admin(self):
        return self.role == "ADMIN"

    def is_org(self):
        return self.role == "ORG"

    def is_researcher(self):
        return self.role == "RESEARCHER"

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"