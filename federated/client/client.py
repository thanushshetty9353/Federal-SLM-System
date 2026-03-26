import flwr as fl
from federated.client.local_training import train_local_model


class FLClient(fl.client.NumPyClient):

    def get_parameters(self, config):
        return []

    def fit(self, parameters, config):
        updated_weights = train_local_model(parameters)
        return updated_weights, 1, {}

    def evaluate(self, parameters, config):
        return 0.0, 0, {}


def start_client():
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=FLClient()
    )


if __name__ == "__main__":
    start_client()