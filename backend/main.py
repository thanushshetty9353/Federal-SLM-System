from fastapi import FastAPI

from backend.api import documents, slm, schema, auth, admin, org
from backend.models.database import init_db

from backend.models import ocr_model, slm_model, schema_model, user_model

app = FastAPI(title="Federated Document Intelligence")

init_db()

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

app.include_router(documents.router)
app.include_router(slm.router, prefix="/slm", tags=["SLM"])

app.include_router(schema.router, prefix="/schema", tags=["Schema"])

# 🔥 NEW
app.include_router(org.router)


@app.get("/")
def root():
    return {"message": "Federated SLM Document Intelligence API Running"}