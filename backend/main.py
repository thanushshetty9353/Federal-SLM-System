from fastapi import FastAPI

from backend.api import documents
from backend.models.database import init_db

app = FastAPI(title="Federated Document Intelligence")

# Initialize DB
init_db()

# Register routes
app.include_router(documents.router)