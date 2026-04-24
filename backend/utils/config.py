import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Agasthya999@localhost:5432/federated_docs"
)

STORAGE_PATH = "backend/storage/documents"