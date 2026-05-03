from functools import lru_cache

from openai import AsyncOpenAI

from app.core.config import settings


@lru_cache(maxsize=1)
def get_openai() -> AsyncOpenAI:
    """
    Returns a singleton async client pointed at OpenRouter.
    OpenRouter is OpenAI-API-compatible — same SDK, different base_url.
    """
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url="https://openrouter.ai/api/v1",
    )
