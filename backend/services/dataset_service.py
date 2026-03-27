import json
import os

# 🔥 Your correct storage path
DATASET_PATH = "backend/storage/datasets/dataset.json"


# =========================
# SAVE (OVERWRITE MODE)
# =========================
def save_records(records):
    try:
        # Create folder if not exists
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)

        # 🔥 OVERWRITE instead of append
        with open(DATASET_PATH, "w") as f:
            json.dump(records, f, indent=2)

        print(f"✅ Dataset overwritten with {len(records)} records")

    except Exception as e:
        print("❌ Error saving dataset:", e)


# =========================
# LOAD DATASET
# =========================
def load_dataset():
    try:
        if not os.path.exists(DATASET_PATH):
            return []

        with open(DATASET_PATH, "r") as f:
            return json.load(f)

    except Exception as e:
        print("❌ Error loading dataset:", e)
        return []


# =========================
# CLEAR DATASET (AFTER TRAINING)
# =========================
def clear_dataset():
    try:
        if os.path.exists(DATASET_PATH):
            os.remove(DATASET_PATH)
            print("🧹 Dataset cleared after training")

    except Exception as e:
        print("❌ Error clearing dataset:", e)