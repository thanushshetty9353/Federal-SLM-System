def build_prompt(fields, text):

    return f"""
You are an intelligent document extraction AI.

Extract the following fields:

{fields}

Return ONLY valid JSON array.

TEXT:
{text}
"""