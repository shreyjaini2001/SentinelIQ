from abc import ABC, abstractmethod
from typing import AsyncIterator


class LLMProvider(ABC):
    """Contract for any LLM backend (Anthropic, OpenAI, local, mock)."""

    @abstractmethod
    async def complete(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 1024,
        use_cache: bool = True,
    ) -> str: ...

    @abstractmethod
    async def stream(
        self,
        messages: list[dict],
        system: str,
        model: str,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]: ...
