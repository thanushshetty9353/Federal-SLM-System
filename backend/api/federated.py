from fastapi import APIRouter, Depends, HTTPException
from backend.services.federated_service import start_federated_training
from backend.api.deps import require_role

router = APIRouter(prefix="/federated", tags=["Federated"])


@router.post("/train")
def start_training(user=Depends(require_role(["ADMIN"]))):
    try:
        start_federated_training()
        return {"message": "Federated training started successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))