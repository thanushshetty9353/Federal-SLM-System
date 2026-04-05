import torch
import os
from federated.models.model import get_model
from backend.models.database import SessionLocal
from backend.models.user_model import User


# =========================
# 🔥 SAFE WEIGHT AVERAGING
# =========================
def average_weights(weights_list):
    avg_weights = {}

    for key in weights_list[0].keys():
        avg_weights[key] = sum(
            w[key] for w in weights_list
        ) / len(weights_list)

    return avg_weights


# =========================
# 🔥 GLOBAL MODEL UPDATE
# =========================
def update_global_model():
    print("\n🚀 AUTO GLOBAL UPDATE STARTED\n")

    db = SessionLocal()

    try:
        orgs = db.query(User).filter(
            User.role == "ORG",
            User.is_approved == True
        ).all()

        weights_list = []

        for org in orgs:
            path = f"backend/storage/org_{org.id}/local_model.pth"

            if not os.path.exists(path):
                print(f"⚠️ org_{org.id} has no model")
                continue

            try:
                weights = torch.load(path, map_location="cpu")
                weights_list.append(weights)
                print(f"✅ Loaded org_{org.id} model")

            except Exception as e:
                print(f"❌ Failed loading org_{org.id}: {e}")

        # =========================
        # NO MODELS CASE
        # =========================
        if not weights_list:
            print("❌ No models found for aggregation")
            return

        # =========================
        # AGGREGATION
        # =========================
        global_model = get_model()

        new_weights = average_weights(weights_list)
        global_model.load_state_dict(new_weights)

        # =========================
        # SAVE GLOBAL MODEL
        # =========================
        os.makedirs("backend/storage", exist_ok=True)

        torch.save(
            global_model.state_dict(),
            "backend/storage/global_model.pth"
        )

        print("\n✅ GLOBAL MODEL UPDATED SUCCESSFULLY\n")

    finally:
        db.close()