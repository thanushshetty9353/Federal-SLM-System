import json
import os
import hashlib
import pandas as pd

BASE_PATH = "backend/storage/datasets"


# =====================================
# DATASET PATH
# =====================================

def get_dataset_path(org_id):

    os.makedirs(BASE_PATH, exist_ok=True)

    return os.path.join(
        BASE_PATH,
        f"org_{org_id}.json"
    )


# =====================================
# RECORD HASH
# =====================================

def get_record_hash(record):

    record_str = json.dumps(
        record,
        sort_keys=True
    )

    return hashlib.sha256(
        record_str.encode()
    ).hexdigest()


# =====================================
# SAVE RECORDS
# =====================================

def save_records(records, org_id):

    try:

        path = get_dataset_path(org_id)

        if os.path.exists(path):

            with open(path, "r") as f:

                existing_data = json.load(f)

        else:

            existing_data = []

        existing_hashes = set(
            get_record_hash(r)
            for r in existing_data
        )

        new_records = []

        for record in records:

            record_hash = get_record_hash(record)

            if record_hash not in existing_hashes:

                new_records.append(record)

                existing_hashes.add(record_hash)

        final_data = existing_data + new_records

        with open(path, "w") as f:

            json.dump(final_data, f, indent=2)

        print(
            f"✅ Org {org_id}: "
            f"Added {len(new_records)} new records"
        )

    except Exception as e:

        print("❌ Error saving dataset:", e)


# =====================================
# LOAD DATASET
# =====================================

def load_dataset(org_id):

    try:

        path = get_dataset_path(org_id)

        if not os.path.exists(path):

            return []

        with open(path, "r") as f:

            return json.load(f)

    except Exception as e:

        print("❌ Error loading dataset:", e)

        return []


# =====================================
# CLEAR DATASET
# =====================================

def clear_dataset(org_id):

    try:

        path = get_dataset_path(org_id)

        if os.path.exists(path):

            os.remove(path)

            print(
                f"🧹 Dataset cleared for org {org_id}"
            )

    except Exception as e:

        print("❌ Error clearing dataset:", e)


# =====================================
# SAVE CSV DATASET
# =====================================

def save_csv_dataset(df, org_id):

    csv_path = os.path.join(
        BASE_PATH,
        f"org_{org_id}.csv"
    )

    df.to_csv(csv_path, index=False)

    return csv_path