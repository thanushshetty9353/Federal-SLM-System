def proof_of_work(block, difficulty=3):
    prefix = "0" * difficulty

    while not block.hash.startswith(prefix):
        block.nonce += 1
        block.hash = block.calculate_hash()

    return block.hash