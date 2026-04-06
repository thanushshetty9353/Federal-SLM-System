import hashlib
import json
from datetime import datetime


class Block:
    def __init__(self, index, data, previous_hash, signature=None):
        self.index = index

        # ✅ FIXED TIMESTAMP (ISO FORMAT)
        self.timestamp = datetime.utcnow().isoformat()

        self.data = data
        self.previous_hash = previous_hash
        self.nonce = 0

        # 🔐 DIGITAL SIGNATURE
        self.signature = signature

        self.hash = self.calculate_hash()

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