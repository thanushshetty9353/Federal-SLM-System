import flwr as fl
import torch
import sys

from federated.models.model import get_model
from federated.client.local_training import train_local_model
from federated.client.dataset import load_data


class FLClient(fl.client.NumPyClient):
    def __init__(self, org_id):
        print(f"🚀 Initializing client for org_{org_id}")

        self.org_id = org_id
        self.model = get_model()
        self.X, self.y = load_data(org_id)

    # 🔹 Send model weights
    def get_parameters(self, config):
        return [
            val.detach().cpu().numpy()
            for val in self.model.state_dict().values()
        ]

    # 🔹 Receive global model
    def set_parameters(self, parameters):
        state_dict = dict(zip(self.model.state_dict().keys(), parameters))

        self.model.load_state_dict(
            {k: torch.tensor(v) for k, v in state_dict.items()}
        )

    # 🔹 Local training
    def fit(self, parameters, config):
        print(f"\n🔥 ORG {self.org_id} TRAINING STARTED")

        self.set_parameters(parameters)

        if len(self.X) == 0:
            print(f"⚠️ Org {self.org_id}: No data found")
            return self.get_parameters(config), 1, {}

        train_local_model(self.model, self.X, self.y)

        print(f"✅ ORG {self.org_id}: Training completed")

        return self.get_parameters(config), len(self.X), {}

    # 🔹 Evaluation
    def evaluate(self, parameters, config):
        return 0.0, len(self.X), {}


# 🔥 FUNCTION FOR API USAGE (IMPORTANT)
def start_client(org_id):
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080",
        client=FLClient(org_id)
    )


# 🔥 FUNCTION FOR LOCAL TRAIN (API use)
def train_local_api(org_id):
    model = get_model()
    X, y = load_data(org_id)

    if len(X) == 0:
        print(f"⚠️ Org {org_id}: No data")
        return None

    train_local_model(model, X, y)

    return model.state_dict()


# 🔹 CLI fallback (optional)
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python -m federated.client.client <org_id>")
        exit()

    org_id = int(sys.argv[1])
    start_client(org_id)