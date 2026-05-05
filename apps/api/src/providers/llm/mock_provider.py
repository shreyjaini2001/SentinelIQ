from typing import AsyncIterator
from src.providers.llm.base import LLMProvider
from src.llm.mock_client import complete_mock, stream_mock


class MockLLMProvider(LLMProvider):
    """Fully deterministic mock — no network calls, no API credits required."""

    async def complete(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 1024,
        use_cache: bool = True,
    ) -> str:
        return await complete_mock(messages, system, model, max_tokens)

    async def stream(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        async for chunk in stream_mock(messages, system, model, max_tokens):
            yield chunk
