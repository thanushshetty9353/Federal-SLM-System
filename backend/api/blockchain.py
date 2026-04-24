from fastapi import APIRouter
from backend.services.blockchain_service import blockchain

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])


@router.get("/audit")
def get_chain():
    return [block.__dict__ for block in blockchain.chain]