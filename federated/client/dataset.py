import json
import numpy as np

DATA_PATH = "federated/client/client_data.json"


def load_data():
    try:
        with open(DATA_PATH, "r") as f:
            data = json.load(f)
    except:
        return np.array([]), np.array([])

    X = []
    y = []

    for item in data:
        # Example: use age as feature, disease as label
        age = int(item.get("core_fields", {}).get("age", 0))
        disease = item.get("core_fields", {}).get("disease", "Healthy")

        X.append([age])
        y.append(1 if disease != "Healthy" else 0)

    return np.array(X), np.array(y)