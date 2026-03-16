from fastapi import FastAPI

from backend.api import documents
from backend.models.database import init_db

app = FastAPI(title="Federated Document Intelligence")

# Create database tables when server starts
init_db()

# Register API routes
app.include_router(documents.router)