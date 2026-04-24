from backend.blockchain.blockchain import Blockchain
from backend.models.database import SessionLocal
from backend.models.blockchain_model import BlockchainLog

from backend.blockchain.crypto import sign_data
from backend.blockchain.keys import private_key

import json

blockchain = Blockchain()


def log_action(org_id, action, doc_hash=None, details=None):
    data = {
        "org_id": org_id,
        "action": action,
        "doc_hash": doc_hash,
        "details": details
    }

    # 🔐 SIGN DATA
    data_string = json.dumps(data, sort_keys=True)
    signature = sign_data(private_key, data_string)

    # ADD SIGNATURE INTO DATA
    data["signature"] = signature

    # ADD BLOCK
    block = blockchain.add_block(data)

    # SAVE TO DATABASE
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