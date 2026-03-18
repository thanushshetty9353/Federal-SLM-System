from fastapi import FastAPI
from backend.api import documents, slm, schema
from backend.models.database import init_db
from backend.models import ocr_model, slm_model, schema_model   # 👈 ADD THIS

app = FastAPI(title="Federated Document Intelligence")

init_db()

app.include_router(documents.router)
app.include_router(slm.router, prefix="/slm", tags=["SLM"])
app.include_router(schema.router, prefix="/admin", tags=["Admin"])