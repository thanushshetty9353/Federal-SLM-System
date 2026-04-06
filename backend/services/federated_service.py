import torch
import os

from federated.models.model import get_model
from backend.models.database import SessionLocal
from backend.models.user_model import User
from backend.services.blockchain_service import log_action


def average_weights(weights_list):
    avg_weights = {}

    for key in weights_list[0].keys():
        avg_weights[key] = sum(w[key] for w in weights_list) / len(weights_list)

    return avg_weights


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
                continue

            try:
                weights = torch.load(path, map_location="cpu")
                weights_list.append(weights)
            except Exception as e:
                print(f"Error loading org {org.id}: {e}")

        if not weights_list:
            print("No models found")
            return

        global_model = get_model()
        new_weights = average_weights(weights_list)
        global_model.load_state_dict(new_weights)

        os.makedirs("backend/storage", exist_ok=True)

        torch.save(
            global_model.state_dict(),
            "backend/storage/global_model.pth"
        )

        print("\n✅ GLOBAL MODEL UPDATED\n")

        # 🔥 BLOCKCHAIN LOG
        log_action(
            org_id=0,
            action="GLOBAL_MODEL_UPDATED"
        )

    finally:
        db.close()