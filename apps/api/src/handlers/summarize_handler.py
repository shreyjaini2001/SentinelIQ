from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.llm import client as llm
from src.components.session_manager import build_session_summary
from config import settings

_SYSTEM = """You are SentinelIQ's documentation AI. Given an investigation session context,
generate a concise executive summary of the investigation findings.

Structure:
## Investigation Summary
**What happened:** ...
**Entities involved:** ...
**Key findings:** ...
**Recommended next steps:** ...

Be concise and factual. Use security terminology appropriate for a senior audience."""


class SummarizeHandler(BaseHandler):
    name = "summarize"
    description = "Summarize the current investigation as a report"
    trigger_phrases = ["summarize", "summary", "report", "document", "brief"]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        yield {"type": "progress", "message": "Gathering investigation context...", "step": 1, "total_steps": 3}

        session_summary = build_session_summary(ctx)
        query_count = len(ctx.query_history)
        entities_str = ", ".join(f"{e.type}:{e.value}" for e in ctx.active_entities)

        user_content = (
            f"Investigation session:\n{session_summary}\n\n"
            f"Total queries run: {query_count}\n"
            f"Entities investigated: {entities_str or 'None identified'}\n"
            f"Analyst notes: {'; '.join(ctx.analyst_notes) if ctx.analyst_notes else 'None'}"
        )

        yield {"type": "progress", "message": "Generating investigation summary...", "step": 2, "total_steps": 3}

        output_parts = []
        async for chunk in llm.stream(
            messages=[{"role": "user", "content": user_content}],
            system=_SYSTEM,
            model=settings.action_model,
            max_tokens=1024,
        ):
            output_parts.append(chunk)

        yield {"type": "progress", "message": "Summary complete.", "step": 3, "total_steps": 3}
        yield {
            "type": "result",
            "handler": self.name,
            "output": "".join(output_parts),
            "session_updated": True,
        }
