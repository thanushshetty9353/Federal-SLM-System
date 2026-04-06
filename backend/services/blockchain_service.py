from backend.blockchain.blockchain import Blockchain
from backend.models.database import SessionLocal
from backend.models.blockchain_model import BlockchainLog

blockchain = Blockchain()


def log_action(org_id, action, doc_hash=None, details=None):
    data = {
        "org_id": org_id,
        "action": action,
        "doc_hash": doc_hash,
        "details": details
    }

    block = blockchain.add_block(data)

    # ✅ SAVE TO DATABASE
    db = SessionLocal()
    try:
        log = BlockchainLog(
            org_id=org_id,
            action=action,
            doc_hash=doc_hash,
            block_hash=block.hash
        )
        db.add(log)
        db.commit()
    finally:
        db.close()

    return block.hash