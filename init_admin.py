from backend.models.database import SessionLocal, init_db
from backend.models.user_model import User
from backend.models import document_model, ocr_model, slm_model, schema_model, user_model # Import all models
from backend.services.auth_service import hash_password

def create_admin():
    # Ensure tables exist
    init_db()
    
    db = SessionLocal()
    
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@feddi.io").first()
    
    if not admin:
        admin_user = User(
            email="admin@feddi.io",
            password=hash_password("admin123"),
            role="ADMIN",
            is_approved=True,
            can_download_global=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Default Admin created: admin@feddi.io / admin123")
    else:
        print("ℹ️ Admin already exists.")
    
    db.close()

if __name__ == "__main__":
    create_admin()
