import json
import os
from backend.blockchain.block import Block

FILE_PATH = "backend/storage/blockchain.json"


def save_chain(chain):
    os.makedirs("backend/storage", exist_ok=True)

    with open(FILE_PATH, "w") as f:
        json.dump([block.__dict__ for block in chain], f, indent=4)


def load_chain():
    if not os.path.exists(FILE_PATH):
        return []

    with open(FILE_PATH, "r") as f:
        data = json.load(f)

    chain = []

    for item in data:
        block = Block(
            index=item["index"],
            data=item["data"],
            previous_hash=item["previous_hash"],
            timestamp=item["timestamp"],   # ✅ preserve
            nonce=item["nonce"],           # ✅ preserve
            hash=item["hash"],             # ✅ preserve
            signature=item.get("signature")  # ✅ preserve
        )

        chain.append(block)

    return chain