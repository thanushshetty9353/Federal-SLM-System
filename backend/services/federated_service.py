import torch
import os

from backend.services.blockchain_service import log_action


# =========================
# 🔥 AVERAGE TWO MODELS (INCREMENTAL)
# =========================
def average_two_models(global_weights, local_weights):
    new_weights = {}

    for key in global_weights.keys():
        new_weights[key] = (global_weights[key] + local_weights[key]) / 2

    return new_weights


# =========================
# 🔥 INCREMENTAL GLOBAL UPDATE
# =========================
def update_global_model(org_id, job_id):
    print(f"\n🚀 INCREMENTAL GLOBAL UPDATE STARTED FOR JOB {job_id}\n")

    base_path = "backend/storage"

    local_model_path = os.path.join(base_path, f"org_{org_id}", f"local_model_job_{job_id}.pth")
    global_model_path = os.path.join(base_path, f"global_model_job_{job_id}.pth")

    # =========================
    # ❌ LOCAL MODEL CHECK
    # =========================
    if not os.path.exists(local_model_path):
        print(f"❌ Local model not found for org_{org_id} on job_{job_id}")
        return

    # =========================
    # ✅ LOAD LOCAL MODEL
    # =========================
    try:
        local_weights = torch.load(local_model_path, map_location="cpu")
        print(f"✅ Loaded local model from org_{org_id}")
    except Exception as e:
        print(f"❌ Failed to load local model: {e}")
        return

    # =========================
    # 🆕 FIRST GLOBAL MODEL
    # =========================
    if not os.path.exists(global_model_path):
        print("🆕 No global model found → creating first global model")

        try:
            torch.save(local_weights, global_model_path)
            print("✅ GLOBAL MODEL CREATED (FIRST TIME)\n")

            log_action(
                org_id=org_id,
                action="GLOBAL_MODEL_INITIALIZED",
                details=f"First global model created for job {job_id}"
            )

        except Exception as e:
            print(f"❌ Failed to create global model: {e}")

        return

    # =========================
    # 🔁 LOAD EXISTING GLOBAL
    # =========================
    try:
        global_weights = torch.load(global_model_path, map_location="cpu")
        print("✅ Loaded existing global model")
    except Exception as e:
        print(f"❌ Failed to load global model: {e}")
        return

    # =========================
    # 🔥 INCREMENTAL UPDATE
    # =========================
    try:
        updated_weights = average_two_models(global_weights, local_weights)
        print("⚙️ Incremental aggregation done")
    except Exception as e:
        print(f"❌ Aggregation failed: {e}")
        return

    # =========================
    # 💾 SAVE UPDATED GLOBAL
    # =========================
    try:
        torch.save(updated_weights, global_model_path)
        print("✅ GLOBAL MODEL UPDATED (INCREMENTAL)\n")
    except Exception as e:
        print(f"❌ Failed to save global model: {e}")
        return

    # =========================
    # 🔗 BLOCKCHAIN LOG
    # =========================
    try:
        log_action(
            org_id=org_id,
            action="GLOBAL_MODEL_UPDATED_INCREMENTAL",
            details=f"Updated using org_{org_id} for job_{job_id}"
        )
        print("🔗 Blockchain log added\n")
    except Exception as e:
        print(f"⚠️ Blockchain logging failed: {e}")