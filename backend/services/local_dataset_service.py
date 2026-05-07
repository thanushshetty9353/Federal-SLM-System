import pandas as pd

from backend.services.dataset_service import (
    save_dataset
)


def save_local_dataset(df, org_id):

    return save_dataset(df, org_id)