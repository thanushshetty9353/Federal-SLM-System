import torch
import pandas as pd
import torch.nn as nn

from pathlib import Path
from sqlalchemy.orm import Session

from backend.services.feature_service import (
    get_schema_features
)

# =========================
# STORAGE
# =========================

MODEL_DIR = Path(
    "backend/storage/local_models"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================
# SIMPLE MODEL
# =========================

class SimpleModel(nn.Module):

    def __init__(self, input_size):

        super().__init__()

        self.fc = nn.Linear(input_size, 2)

    def forward(self, x):

        return self.fc(x)


# =========================
# TRAIN LOCAL MODEL
# =========================

def train_local_model(
    db: Session,
    dataset_path: str,
    doc_type: str,
    org_id: int,
    job_id: int
):

    # =========================
    # LOAD SCHEMA
    # =========================

    schema_data = get_schema_features(
        db,
        doc_type
    )

    features = schema_data["features"]

    target = schema_data["target"]

    # =========================
    # LOAD DATASET
    # =========================

    df = pd.read_csv(dataset_path)

    # =========================
    # VALIDATE COLUMNS
    # =========================

    missing = [
        col
        for col in features + [target]
        if col not in df.columns
    ]

    if missing:

        raise Exception(
            f"Dataset missing columns: {missing}"
        )

    # =========================
    # FEATURES + TARGET
    # =========================

    X = df[features].values

    y = df[target].values

    # =========================
    # TENSORS
    # =========================

    X_tensor = torch.tensor(
        X,
        dtype=torch.float32
    )

    y_tensor = torch.tensor(
        y,
        dtype=torch.long
    )

    # =========================
    # MODEL
    # =========================

    model = SimpleModel(len(features))

    criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.001
    )

    # =========================
    # TRAINING LOOP
    # =========================

    for epoch in range(50):

        optimizer.zero_grad()

        outputs = model(X_tensor)

        loss = criterion(
            outputs,
            y_tensor
        )

        loss.backward()

        optimizer.step()

    # =========================
    # SAVE LOCAL MODEL
    # =========================

    org_dir = MODEL_DIR / f"org_{org_id}"

    org_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    save_path = (
        org_dir /
        f"local_model_job_{job_id}.pth"
    )

    torch.save(
        model.state_dict(),
        save_path
    )

    print(
        f"\n✅ LOCAL MODEL SAVED:\n{save_path}\n"
    )

    return {
        "message": "Local model trained",
        "path": str(save_path),
        "features": features,
        "target": target
    }