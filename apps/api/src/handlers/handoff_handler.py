import re
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.handoff import generate_handoff

_WINDOW_MAP = {
    "4h": "last 4 hours", "4 hour": "last 4 hours",
    "8h": "last 8 hours", "8 hour": "last 8 hours",
    "12h": "last 12 hours", "12 hour": "last 12 hours",
    "shift": "last 8 hours", "today": "last 12 hours",
}


def _extract_window(text: str) -> str:
    text_lower = text.lower()
    for kw, val in _WINDOW_MAP.items():
        if kw in text_lower:
            return val
    return "last 8 hours"


class HandoffHandler(BaseHandler):
    name = "handoff"
    description = "Generate a shift handoff briefing for the incoming analyst"
    trigger_phrases = [
        "handoff", "hand off", "hand-off",
        "brief the next shift", "brief the next analyst",
        "next shift", "shift briefing", "shift summary", "shift change",
        "what should the next analyst know", "write my handoff",
        "handoff summary", "handoff briefing",
        "end of shift", "next analyst",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        user_text = ctx.last_action_text or (
            ctx.query_history[-1].original_text if ctx.query_history else ""
        )
        shift_window = _extract_window(user_text)

        yield {
            "type": "progress",
            "message": f"Gathering open alerts and incidents for {shift_window}...",
            "step": 1,
            "total_steps": 4,
        }

        yield {
            "type": "progress",
            "message": "Ranking items by urgency and SLA...",
            "step": 2,
            "total_steps": 4,
        }

        yield {
            "type": "progress",
            "message": "Generating key context narrative...",
            "step": 3,
            "total_steps": 4,
        }

        # Build context from session
        session_lines: list[str] = []
        if ctx.active_entities:
            session_lines.append("Entities: " + ", ".join(f"{e.value}" for e in ctx.active_entities[:5]))
        if ctx.query_history:
            session_lines.append(f"Queries run this session: {len(ctx.query_history)}")
        if ctx.compressed_summary:
            session_lines.append(f"Session summary: {ctx.compressed_summary}")
        context_text = "\n".join(session_lines)

        result = await generate_handoff(
            context_text=context_text,
            shift_window=shift_window,
        )

        yield {
            "type": "progress",
            "message": f"Handoff ready — {len(result.open_items)} open items, {len(result.watch_list)} on watch list.",
            "step": 4,
            "total_steps": 4,
        }

        lines = [
            f"## Shift Handoff Briefing — {result.shift_window}\n",
            f"**Open:** {len(result.open_items)} items  "
            f"**Closed:** {len(result.closed_items)} items\n",
            "### Key Context",
            result.key_context + "\n",
            "### Watch List",
        ]
        for item in result.watch_list:
            lines.append(f"- {item}")

        lines.append("\n### Recommended Next Actions")
        for i, action in enumerate(result.recommended_next_actions, 1):
            lines.append(f"{i}. {action}")

        lines.append("\n### Open Items (by priority)")
        for item in result.open_items[:8]:
            lines.append(f"- [{item.urgency.upper()}] **{item.title}** — {item.entity_scope}")

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": False,
        }
