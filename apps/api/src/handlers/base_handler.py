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
        """Return match confidence 0-1. Longer phrase = higher specificity = higher score."""
        best = 0.0
        text_lower = intent_label.lower()
        for phrase in self.trigger_phrases:
            if phrase.lower() in text_lower:
                score = 0.9 + len(phrase) * 0.0001
                if score > best:
                    best = score
        return best
