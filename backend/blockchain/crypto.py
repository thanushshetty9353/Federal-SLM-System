from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding


# 🔑 GENERATE KEYS
def generate_keys():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    public_key = private_key.public_key()
    return private_key, public_key


# 🔐 SIGN
def sign_data(private_key, data: str):
    signature = private_key.sign(
        data.encode(),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return signature.hex()


# 🔍 VERIFY
def verify_signature(public_key, data: str, signature: str):
    try:
        public_key.verify(
            bytes.fromhex(signature),
            data.encode(),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except:
        return False