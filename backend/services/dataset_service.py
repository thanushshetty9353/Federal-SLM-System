import json
import os

DATASET_PATH = "backend/storage/datasets/dataset.json"


def save_records(records):

    os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)

    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, "r") as f:
            data = json.load(f)
    else:
        data = []

    data.extend(records)

    with open(DATASET_PATH, "w") as f:
        json.dump(data, f, indent=2)


def load_dataset():
    if not os.path.exists(DATASET_PATH):
        return []

    with open(DATASET_PATH, "r") as f:
        return json.load(f)


def clear_dataset():
    if os.path.exists(DATASET_PATH):
        os.remove(DATASET_PATH)