from .block import Block
from .proof import proof_of_work
from .storage import save_chain, load_chain

from backend.blockchain.crypto import verify_signature
from backend.blockchain.keys import public_key

import json


class Blockchain:
    def __init__(self):
        self.chain = load_chain()

        if not self.chain:
            self.create_genesis_block()

    def create_genesis_block(self):
        genesis = Block(0, {"msg": "Genesis Block"}, "0")
        proof_of_work(genesis)
        self.chain.append(genesis)
        save_chain(self.chain)

    def get_latest_block(self):
        return self.chain[-1]

    def add_block(self, data):
        prev = self.get_latest_block()

        new_block = Block(
            index=len(self.chain),
            data=data,
            previous_hash=prev.hash,
            signature=data.get("signature")  # 🔐 attach signature
        )

        proof_of_work(new_block)

        self.chain.append(new_block)
        save_chain(self.chain)

        # 🔥 VALIDATION CHECK
        if not self.is_chain_valid():
            raise Exception("❌ Blockchain integrity compromised!")

        return new_block

    # =========================
    # 🔐 CHAIN VALIDATION
    # =========================
    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            # 🔹 Hash check
            if current.hash != current.calculate_hash():
                return False

            # 🔹 Link check
            if current.previous_hash != prev.hash:
                return False

            # 🔐 Signature verification
            data = current.data.copy()
            signature = data.get("signature")

            if signature:
                data_without_sig = data.copy()
                data_without_sig.pop("signature", None)

                data_string = json.dumps(data_without_sig, sort_keys=True)

                if not verify_signature(public_key, data_string, signature):
                    return False

        return True