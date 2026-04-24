import hashlib
import json
from datetime import datetime


class Block:
    def __init__(
        self,
        index,
        data,
        previous_hash,
        timestamp=None,
        nonce=0,
        hash=None,
        signature=None
    ):
        self.index = index
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.signature = signature

        # ✅ ONLY calculate hash if not provided
        self.hash = hash or self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "signature": self.signature
        }, sort_keys=True)

        return hashlib.sha256(block_string.encode()).hexdigest()