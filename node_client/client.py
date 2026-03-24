import flwr as fl
import numpy as np
from node_client.local_training import train_local_model
from node_client.secure_aggregation import encrypt_weights

class Client(fl.client.NumPyClient):

    def __init__(self):
        self.data = np.random.rand(100, 5)

    def get_parameters(self, config):
        return [np.random.rand(5)]

    def fit(self, parameters, config):
        weights = train_local_model(parameters[0], self.data)

        # Apply secure aggregation
        encrypted = encrypt_weights(weights)

        return [encrypted], len(self.data), {}

    def evaluate(self, parameters, config):
        return float(np.random.rand()), len(self.data), {}

if __name__ == "__main__":
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=Client()
    )