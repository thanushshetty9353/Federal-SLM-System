from .block import Block
from .proof import proof_of_work
from .storage import save_chain, load_chain


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
            previous_hash=prev.hash
        )

        proof_of_work(new_block)

        self.chain.append(new_block)
        save_chain(self.chain)

        return new_block