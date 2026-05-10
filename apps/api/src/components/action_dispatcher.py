import json
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.handlers.summarize_handler import SummarizeHandler
from src.handlers.triage_handler import TriageHandler
from src.handlers.hunt_handler import HuntHandler
from src.handlers.timeline_handler import TimelineHandler
from src.handlers.blast_radius_handler import BlastRadiusHandler
from src.handlers.documentation_handler import DocumentationHandler
from src.handlers.comparative_handler import ComparativeHandler
from src.handlers.rule_suggestion_handler import RuleSuggestionHandler
from src.handlers.handoff_handler import HandoffHandler
from src.handlers.runbook_handler import RunbookHandler
from src.handlers.noise_coaching_handler import NoiseCoachingHandler
from src.models.session import SessionContext

_REGISTRY: list[BaseHandler] = [
    SummarizeHandler(),
    TriageHandler(),
    HuntHandler(),
    TimelineHandler(),
    BlastRadiusHandler(),
    DocumentationHandler(),
    ComparativeHandler(),
    RuleSuggestionHandler(),
    HandoffHandler(),
    RunbookHandler(),
    NoiseCoachingHandler(),
]

_CONFIDENCE_THRESHOLD = 0.7


async def dispatch(
    intent_label: str,
    ctx: SessionContext,
    confirmed_handler: str | None = None,
) -> AsyncIterator[dict]:
    if confirmed_handler:
        handler = _find_by_name(confirmed_handler)
        if handler:
            async for event in handler.run(ctx):
                yield event
            return
        yield {"type": "error", "message": f"Handler '{confirmed_handler}' not found", "code": "HANDLER_NOT_FOUND"}
        return

    # Score all handlers
    scored = [
        (h, h.matches(intent_label))
        for h in _REGISTRY
    ]
    scored.sort(key=lambda x: x[1], reverse=True)

    top_handler, top_score = scored[0]

    if top_score >= _CONFIDENCE_THRESHOLD:
        async for event in top_handler.run(ctx):
            yield event
    else:
        # Disambiguation: show top 2 handlers as chips
        chips = [
            {"handler": h.name, "label": h.description}
            for h, score in scored[:2]
        ]
        yield {"type": "disambiguation", "chips": chips}


def _find_by_name(name: str) -> BaseHandler | None:
    return next((h for h in _REGISTRY if h.name == name), None)


def get_registry_info() -> list[dict]:
    return [
        {"name": h.name, "description": h.description, "trigger_phrases": h.trigger_phrases}
        for h in _REGISTRY
    ]
