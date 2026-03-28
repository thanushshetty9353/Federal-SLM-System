import flwr as fl
import torch
import sys

from federated.models.model import get_model
from federated.client.local_training import train_local_model
from federated.client.dataset import load_data


class FLClient(fl.client.NumPyClient):
    def __init__(self, org_id):
        print(f"🚀 Initializing client for org_{org_id}")

        self.model = get_model()
        self.X, self.y = load_data(org_id)

    # 🔹 Send model parameters to server
    def get_parameters(self, config):
        return [
            val.detach().cpu().numpy()
            for val in self.model.state_dict().values()
        ]

    # 🔹 Receive global parameters from server
    def set_parameters(self, parameters):
        state_dict = dict(zip(self.model.state_dict().keys(), parameters))

        self.model.load_state_dict(
            {k: torch.tensor(v) for k, v in state_dict.items()}
        )

    # 🔹 Train locally
    def fit(self, parameters, config):
        print("🔥 FIT STARTED")

        self.set_parameters(parameters)

        # Safety check
        if len(self.X) == 0:
            print("⚠️ No data found! Sending dummy update")
            return self.get_parameters(config), 1, {}

        print("📊 Training on local data...")

        train_local_model(self.model, self.X, self.y)

        print("✅ Training completed")

        return self.get_parameters(config), len(self.X), {}

    # 🔹 Evaluation (optional)
    def evaluate(self, parameters, config):
        return 0.0, len(self.X), {}


def start_client(org_id):
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=FLClient(org_id)
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python -m federated.client.client <org_id>")
        print("👉 Example: python -m federated.client.client 1")
        exit()

    org_id = sys.argv[1]

    start_client(org_id)