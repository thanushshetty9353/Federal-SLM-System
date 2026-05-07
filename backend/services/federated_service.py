import torch
import os

from backend.services.blockchain_service import log_action


def average_two_models(global_weights, local_weights):

    new_weights = {}

    for key in global_weights.keys():

        # =========================
        # SHAPE VALIDATION
        # =========================

        if global_weights[key].shape != local_weights[key].shape:

            raise Exception(
                f"Shape mismatch for {key}: "
                f"{global_weights[key].shape} vs "
                f"{local_weights[key].shape}"
            )

        new_weights[key] = (
            global_weights[key] +
            local_weights[key]
        ) / 2

    return new_weights


def update_global_model(org_id, job_id):

    print(f"\n🚀 FEDERATED UPDATE STARTED\n")

    # =========================
    # STORAGE PATHS
    # =========================

    storage_path = "backend/storage"

    local_model_path = os.path.join(
        storage_path,
        "local_models",
        f"org_{org_id}",
        f"local_model_job_{job_id}.pth"
)

    global_model_path = os.path.join(
        storage_path,
        f"global_model_job_{job_id}.pth"
    )

    print("📁 Local Model Path:", local_model_path)
    print("📁 Global Model Path:", global_model_path)

    # =========================
    # CHECK LOCAL MODEL
    # =========================

    if not os.path.exists(local_model_path):

        raise Exception(
            f"Local model not found at {local_model_path}"
        )

    # =========================
    # LOAD LOCAL MODEL
    # =========================

    local_weights = torch.load(
        local_model_path,
        map_location="cpu"
    )

    # =========================
    # FIRST GLOBAL MODEL
    # =========================

    if not os.path.exists(global_model_path):

        torch.save(local_weights, global_model_path)

        log_action(
            org_id=org_id,
            action="GLOBAL_MODEL_INITIALIZED",
            details=f"Job {job_id}"
        )

        return {
            "message": "First global model created"
        }

    # =========================
    # LOAD GLOBAL MODEL
    # =========================

    global_weights = torch.load(
        global_model_path,
        map_location="cpu"
    )

    # =========================
    # AGGREGATE
    # =========================

    updated_weights = average_two_models(
        global_weights,
        local_weights
    )

    # =========================
    # SAVE UPDATED GLOBAL
    # =========================

    torch.save(
        updated_weights,
        global_model_path
    )

    log_action(
        org_id=org_id,
        action="GLOBAL_MODEL_UPDATED",
        details=f"Job {job_id}"
    )

    return {
        "message": "Global model updated"
    }