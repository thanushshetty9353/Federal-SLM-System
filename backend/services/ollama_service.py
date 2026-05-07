from langchain_community.llms.ollama import Ollama

from backend.config.settings import (
    OLLAMA_MODEL,
    OLLAMA_BASE_URL
)

llm = Ollama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL
)

def generate_response(prompt: str):

    response = llm.invoke(prompt)

    return response