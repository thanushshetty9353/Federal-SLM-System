from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.database import get_db

from backend.api.deps import require_role

from backend.services.model_training_service import (
    train_local_model
)

router = APIRouter(
    prefix="/train",
    tags=["Training"]
)


@router.post("/local")
def train_model(
    dataset_path: str,
    doc_type: str,
    org_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    user=Depends(
        require_role(
            ["ADMIN", "ORG", "RESEARCHER"]
        )
    )
):

    result = train_local_model(
        db=db,
        dataset_path=dataset_path,
        doc_type=doc_type,
        org_id=org_id,
        job_id=job_id
    )

    return result