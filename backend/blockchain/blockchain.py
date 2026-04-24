from .block import Block
from .proof import proof_of_work
from .storage import save_chain, load_chain


class Blockchain:
    def __init__(self):
        self.chain = load_chain()

        if not self.chain:
            self.create_genesis_block()

    # =========================
    # 🔥 GENESIS BLOCK
    # =========================
    def create_genesis_block(self):
        genesis = Block(0, {"msg": "Genesis Block"}, "0")
        proof_of_work(genesis)

        self.chain.append(genesis)
        save_chain(self.chain)

    # =========================
    # GET LAST BLOCK
    # =========================
    def get_latest_block(self):
        return self.chain[-1]

    # =========================
    # ADD BLOCK
    # =========================
    def add_block(self, data):
        prev = self.get_latest_block()

        new_block = Block(
            index=len(self.chain),
            data=data,
            previous_hash=prev.hash
            # ❌ signature removed (not implemented properly yet)
        )

        proof_of_work(new_block)

        self.chain.append(new_block)
        save_chain(self.chain)

        # =========================
        # 🔥 SAFE VALIDATION CHECK
        # =========================
        if not self.is_chain_valid():
            print("❌ Blockchain validation failed!")

            # rollback last block (important safety)
            self.chain.pop()
            save_chain(self.chain)

            raise Exception("❌ Blockchain integrity compromised!")

        return new_block

    # =========================
    # 🔐 CHAIN VALIDATION
    # =========================
    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            # 🔹 HASH CHECK
            if current.hash != current.calculate_hash():
                print(f"❌ Hash mismatch at block {i}")
                return False

            # 🔹 LINK CHECK
            if current.previous_hash != prev.hash:
                print(f"❌ Chain broken at block {i}")
                return False

        return True

    # =========================
    # 🔍 GET FULL CHAIN (OPTIONAL DEBUG)
    # =========================
    def get_chain(self):
        return [block.__dict__ for block in self.chain]