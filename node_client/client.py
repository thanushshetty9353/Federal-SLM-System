import flwr as fl
import numpy as np
import torch

from node_client.local_training import train_local_model
from node_client.secure_aggregation import encrypt_weights

# 🔥 NEW IMPORTS
from backend.services.dataset_service import load_dataset, clear_dataset


def convert_to_training_data(dataset):
    """
    Convert JSON → training data
    (TEMP: dummy conversion, will improve later)
    """
    data = []

    for record in dataset:
        x = torch.randn(100)
        y = torch.randn(10)
        data.append((x, y))

    return data


class Client(fl.client.NumPyClient):

    def get_parameters(self, config):
        return [np.random.rand(5)]

    def fit(self, parameters, config):

        # 🔥 Load dataset
        dataset = load_dataset()

        if not dataset:
            print("No dataset found for training")
            return parameters, 0, {}

        train_data = convert_to_training_data(dataset)

        # Train model
        weights = train_local_model(parameters[0], train_data)

        # 🔐 Secure aggregation
        encrypted = encrypt_weights(weights)

        # 🔥 DELETE DATA AFTER TRAINING
        clear_dataset()

        return [encrypted], len(train_data), {}

    def evaluate(self, parameters, config):
        return float(np.random.rand()), 1, {}


if __name__ == "__main__":
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=Client()
    )