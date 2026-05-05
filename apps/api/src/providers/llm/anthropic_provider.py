from typing import AsyncIterator
from src.providers.llm.base import LLMProvider
from src.llm import client as _llm_client


class AnthropicLLMProvider(LLMProvider):
    """Delegates to the existing Anthropic client with prompt caching."""

    async def complete(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 1024,
        use_cache: bool = True,
    ) -> str:
        return await _llm_client.complete(messages, system, model, max_tokens, use_cache)

    async def stream(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        async for chunk in _llm_client.stream(messages, system, model, max_tokens):
            yield chunk
