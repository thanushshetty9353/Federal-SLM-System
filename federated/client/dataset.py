import json
import numpy as np
import os


def load_data(org_id):
    """
    Load dataset for a specific organization
    """

    # Path to backend datasets folder
    BASE_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../backend/storage/datasets")
    )

    file_path = os.path.join(BASE_DIR, f"org_{org_id}.json")

    print(f"📂 Loading data from: {file_path}")

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return np.array([]), np.array([])

    X = []
    y = []

    for item in data:
        core = item.get("core_fields", {})

        age = int(core.get("age", 0))
        disease = core.get("disease", "Healthy")

        # Feature
        X.append([age])

        # Label
        y.append(1 if disease != "Healthy" else 0)

    print(f"✅ Loaded {len(X)} samples for org_{org_id}")

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)