import numpy as np

def encrypt_weights(weights):
    noise = np.random.normal(0, 0.01, size=len(weights))
    return weights + noise

def decrypt_weights(weights):
    return weights