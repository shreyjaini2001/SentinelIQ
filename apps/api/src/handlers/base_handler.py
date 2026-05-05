from abc import ABC, abstractmethod
from typing import AsyncIterator
from src.models.session import SessionContext


class BaseHandler(ABC):
    name: str
    description: str
    trigger_phrases: list[str]

    @abstractmethod
    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        """Yields progress events and a final result event."""
        ...

    def matches(self, intent_label: str, confidence: float = 0.0) -> float:
        """Return match confidence 0-1 for this handler vs intent_label."""
        for phrase in self.trigger_phrases:
            if phrase.lower() in intent_label.lower():
                return 0.9
        return 0.0
