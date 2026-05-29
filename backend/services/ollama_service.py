from langchain_ollama import OllamaLLM

from backend.config.settings import (
    OLLAMA_MODEL,
    OLLAMA_BASE_URL
)

llm = OllamaLLM(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL
)

def generate_response(prompt: str):

    response = llm.invoke(prompt)

    return response