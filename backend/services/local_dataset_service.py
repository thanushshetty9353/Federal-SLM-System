import json
import os

DATASET_PATH = "federated/client/client_data.json"


def save_record(record):
    if not os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, "w") as f:
            json.dump([], f)

    with open(DATASET_PATH, "r") as f:
        data = json.load(f)

    data.append(record)

    with open(DATASET_PATH, "w") as f:
        json.dump(data, f, indent=2)