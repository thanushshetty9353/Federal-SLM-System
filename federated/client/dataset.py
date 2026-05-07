import json
import numpy as np
import os


def load_data(org_id):

    """
    Dynamic dataset loader for federated learning.

    Example JSON:

    [
      {
        "id": 850051,
        "label": 1,
        "radius_mean": 15.47,
        "texture_mean": 14.14,
        "perimeter_mean": 92.47,
        "area_mean": 742.1
      }
    ]

    Target:
        label

    Features:
        all numeric fields except:
        - id
        - label
    """

    # =====================================
    # DATASET PATH
    # =====================================

    BASE_DIR = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../backend/storage/datasets"
        )
    )

    file_path = os.path.join(
        BASE_DIR,
        f"org_{org_id}.json"
    )

    print(f"\n📂 Loading dataset: {file_path}")

    # =====================================
    # LOAD JSON
    # =====================================

    try:

        with open(file_path, "r") as f:

            data = json.load(f)

    except Exception as e:

        print(f"❌ Failed to load dataset: {e}")

        return np.array([]), np.array([])

    # =====================================
    # EMPTY DATASET
    # =====================================

    if not data:

        print("⚠️ Empty dataset")

        return np.array([]), np.array([])

    # =====================================
    # TARGET FIELD
    # =====================================

    target_field = "label"

    # =====================================
    # DETECT FEATURES DYNAMICALLY
    # =====================================

    first_row = data[0]

    feature_fields = []

    for key, value in first_row.items():

        # Skip target
        if key == target_field:
            continue

        # Skip ID fields
        if key.lower() == "id":
            continue

        # Only numeric features
        if isinstance(value, (int, float)):

            feature_fields.append(key)

    print(f"\n✅ TARGET FIELD: {target_field}")

    print(f"\n✅ FEATURE FIELDS:")

    for f in feature_fields:
        print(f"   • {f}")

    print(f"\n✅ TOTAL FEATURES: {len(feature_fields)}")

    # =====================================
    # BUILD X AND y
    # =====================================

    X = []

    y = []

    for item in data:

        try:

            # =========================
            # FEATURES
            # =========================

            row = []

            for field in feature_fields:

                value = item.get(field, 0)

                row.append(float(value))

            # =========================
            # TARGET
            # =========================

            target = int(
                item.get(target_field, 0)
            )

            X.append(row)

            y.append(target)

        except Exception as e:

            print(
                f"⚠️ Skipping invalid row: {e}"
            )

    # =====================================
    # NUMPY CONVERSION
    # =====================================

    X = np.array(
        X,
        dtype=np.float32
    )

    y = np.array(
        y,
        dtype=np.int64
    )

    print(f"\n✅ FINAL DATASET SHAPE")

    print(f"   X shape: {X.shape}")

    print(f"   y shape: {y.shape}")

    return X, y