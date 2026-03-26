from fastapi import APIRouter
from backend.services.federated_service import start_federated_training

router = APIRouter(prefix="/federated", tags=["Federated"])


@router.post("/train")
def start_training():
    start_federated_training()
    return {"message": "Federated training started successfully"}