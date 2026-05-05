import json
import logging
import re
import uuid
import asyncio
from datetime import datetime, timezone
from src.models.requests import SuggestionChip, SuggestionsResponse, AutocompleteCompletion, AutocompleteResponse
from src.models.session import SessionContext
from src.storage import query_store
from src.llm import client as llm
from src.llm.prompts import chip_suggest
from src.components.session_manager import build_session_summary
from config import settings

logger = logging.getLogger(__name__)


def normalize_to_utc(dt: datetime) -> datetime:
    """Return a UTC-aware datetime. Naive datetimes are assumed to be UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_suggestions(ctx: SessionContext) -> SuggestionsResponse:
    if not ctx.query_history:
        return SuggestionsResponse(chips=_default_chips())

    last_entry = ctx.query_history[-1]
    session_summary = build_session_summary(ctx)

    raw = await llm.complete(
        messages=chip_suggest.build_messages(
            session_summary,
            last_entry.original_text,
            last_entry.result_count or 0,
        ),
        system=chip_suggest.SYSTEM,
        model=settings.classifier_model,
        max_tokens=512,
        use_cache=True,
    )

    chips = _parse_chips(raw)
    return SuggestionsResponse(chips=chips)


async def get_autocomplete(
    analyst_id: str,
    prefix: str,
    session_id: str | None = None,
) -> AutocompleteResponse:
    if len(prefix) < 3:
        return AutocompleteResponse(completions=[])

    try:
        history_queries = await query_store.get_autocomplete_suggestions(analyst_id, prefix, limit=5)
        team_pool = await query_store.get_team_pool(limit=3)

        completions: list[AutocompleteCompletion] = []
        now = datetime.now(timezone.utc)

        for q in history_queries:
            try:
                age_hours = (now - normalize_to_utc(q.timestamp)).total_seconds() / 3600
                recency_score = max(0.0, 1.0 - (age_hours / 168))  # decay over 7 days
            except Exception:
                recency_score = 0.0
            completions.append(
                AutocompleteCompletion(
                    text=q.text,
                    source="history",
                    recency_score=round(recency_score, 3),
                )
            )

        for p in team_pool:
            if p.anonymized_text.lower().startswith(prefix.lower()):
                completions.append(
                    AutocompleteCompletion(
                        text=p.anonymized_text,
                        source="team_pool",
                        recency_score=0.5,
                    )
                )

        completions.sort(key=lambda c: c.recency_score, reverse=True)
        return AutocompleteResponse(completions=completions[:5])

    except Exception:
        logger.exception("Autocomplete failed for analyst=%s prefix=%r", analyst_id, prefix)
        return AutocompleteResponse(completions=[])


def _parse_chips(raw: str) -> list[SuggestionChip]:
    try:
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        data = json.loads(cleaned)
        return [
            SuggestionChip(
                id=c.get("id", str(uuid.uuid4())),
                label=c.get("label", ""),
                type=c.get("type", "query"),
                prompt_text=c.get("prompt_text", c.get("label", "")),
            )
            for c in data.get("chips", [])
        ][:6]
    except (json.JSONDecodeError, ValueError):
        return _default_chips()


def _default_chips() -> list[SuggestionChip]:
    return [
        SuggestionChip(id="chip_1", label="Find failed logins", type="query", prompt_text="Show me failed login attempts in the last 24 hours"),
        SuggestionChip(id="chip_2", label="Unusual outbound traffic", type="query", prompt_text="Find unusual outbound network connections in the last 6 hours"),
        SuggestionChip(id="chip_3", label="Privilege escalation", type="query", prompt_text="Look for privilege escalation events this week"),
        SuggestionChip(id="chip_4", label="Triage open alerts", type="action", prompt_text="Triage my open alerts and score for false positives"),
        SuggestionChip(id="chip_5", label="Lateral movement", type="query", prompt_text="Find lateral movement patterns in the last 48 hours"),
    ]
