import torch
import os

from federated.models.model import get_model
from backend.services.blockchain_service import log_action


# =========================
# 🔥 SAFE WEIGHT AVERAGING
# =========================
def average_weights(weights_list):
    avg_weights = {}

    for key in weights_list[0].keys():
        avg_weights[key] = sum(w[key] for w in weights_list) / len(weights_list)

    return avg_weights


# =========================
# 🔥 GLOBAL MODEL UPDATE
# =========================
def update_global_model():
    print("\n🚀 AUTO GLOBAL UPDATE STARTED\n")

    weights_list = []
    base_path = "backend/storage"

    # =========================
    # 🔍 LOAD ALL ORG MODELS
    # =========================
    if not os.path.exists(base_path):
        print("❌ Storage folder not found")
        return

    print("📂 Scanning storage folders...\n")

    for folder in os.listdir(base_path):
        if folder.startswith("org_"):
            org_id = folder.split("_")[1]

            path = os.path.join(base_path, folder, "local_model.pth")

            print(f"🔍 Checking: {path}")

            if not os.path.exists(path):
                print(f"⚠️ org_{org_id} model not found")
                continue

            try:
                weights = torch.load(path, map_location="cpu")
                weights_list.append(weights)
                print(f"✅ Loaded org_{org_id} model")

            except Exception as e:
                print(f"❌ Error loading org_{org_id}: {e}")

    # =========================
    # ❌ NO MODELS FOUND
    # =========================
    if not weights_list:
        print("❌ No models found for aggregation\n")
        return

    # =========================
    # 🔥 AGGREGATION
    # =========================
    print("\n⚙️ Aggregating models...\n")

    global_model = get_model()

    try:
        new_weights = average_weights(weights_list)
        global_model.load_state_dict(new_weights)

    except Exception as e:
        print(f"❌ Aggregation failed: {e}")
        return

    # =========================
    # 💾 SAVE GLOBAL MODEL
    # =========================
    os.makedirs(base_path, exist_ok=True)

    global_model_path = os.path.join(base_path, "global_model.pth")

    try:
        torch.save(global_model.state_dict(), global_model_path)
        print(f"\n✅ GLOBAL MODEL SAVED at: {global_model_path}\n")

    except Exception as e:
        print(f"❌ Failed to save global model: {e}")
        return

    # =========================
    # 🔗 BLOCKCHAIN LOG
    # =========================
    try:
        log_action(
            org_id=0,
            action="GLOBAL_MODEL_UPDATED",
            details="Global model aggregated and saved"
        )
        print("🔗 Blockchain log added\n")

    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")