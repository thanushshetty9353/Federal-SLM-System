from fastapi import FastAPI

# Import APIs
from backend.api import documents
from backend.api import slm

# Import DB
from backend.models.database import init_db

# 🔥 VERY IMPORTANT — import models so tables are registered
from backend.models import ocr_model
from backend.models import slm_model

app = FastAPI(title="Federated Document Intelligence")

# Initialize DB (creates tables)
init_db()

# Register routes
app.include_router(documents.router)
app.include_router(slm.router, prefix="/slm", tags=["SLM"])