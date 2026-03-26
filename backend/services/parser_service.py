import re

def split_records(text):
    lines = text.split("\n")

    records = []
    current = ""

    for line in lines:
        if "Name" in line:
            if current:
                records.append(current.strip())
            current = line
        else:
            current += " " + line

    if current:
        records.append(current.strip())

    return records


def parse_record(record_text):

    def extract(pattern):
        match = re.search(pattern, record_text)
        return match.group(1) if match else ""

    return {
        "name": extract(r"Name[:\s]+([A-Za-z]+)"),
        "age": extract(r"Age[:\s]+(\d+)"),
        "disease": extract(r"Disease[:\s]+([A-Za-z]+)")
    }


def parse_multiple_records(text):
    records = split_records(text)
    return [parse_record(r) for r in records if r.strip()]