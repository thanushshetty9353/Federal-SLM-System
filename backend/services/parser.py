def parse_key_value(output, fields):
    result = {field: "" for field in fields}

    for line in output.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)

            key = key.strip().lower()
            val = val.strip()

            if key in result:
                result[key] = val

    return result