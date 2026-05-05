import re
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.timeline import reconstruct_timeline


class TimelineHandler(BaseHandler):
    name = "timeline"
    description = "Reconstruct the attack timeline for an entity or investigation"
    trigger_phrases = [
        "timeline", "what happened", "trace", "reconstruct",
        "attack chain", "investigate entity", "entity activity",
        "show activity", "kill chain",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        seed_entity = self._resolve_entity(ctx)

        yield {
            "type": "progress",
            "message": f"Gathering events for {seed_entity}...",
            "step": 1,
            "total_steps": 3,
        }

        result = await reconstruct_timeline(seed_entity)

        yield {
            "type": "progress",
            "message": f"Classifying {result.total_events} events by ATT&CK tactic...",
            "step": 2,
            "total_steps": 3,
        }
        yield {
            "type": "progress",
            "message": f"Annotating {len(result.stages)} kill chain stages...",
            "step": 3,
            "total_steps": 3,
        }

        tactic_summary = ", ".join(s.tactic for s in result.stages)
        text_output = (
            f"## Timeline: {seed_entity}\n\n"
            f"{result.total_events} events across {len(result.stages)} ATT&CK stages "
            f"({tactic_summary}).\n"
            f"Window: {result.window_start[:16]} → {result.window_end[:16]}\n"
        )

        yield {
            "type": "result",
            "handler": self.name,
            "output": text_output,
            "data": result.model_dump(),
            "session_updated": True,
        }

    def _resolve_entity(self, ctx: SessionContext) -> str:
        """Extract the best seed entity from session context."""
        # 1. Active entities tracked in session
        if ctx.active_entities:
            for ent in ctx.active_entities:
                if ent.type in ("host", "user", "ip"):
                    return ent.value

        # 2. Entity extracted from last query
        if ctx.query_history:
            last = ctx.query_history[-1]
            if last.extracted_entities:
                return last.extracted_entities[0]
            # Try to extract from original text
            text = last.original_text
            # Look for email addresses
            email = re.search(r"[\w.+-]+@[\w-]+\.\w+", text)
            if email:
                return email.group()
            # Look for hostnames (all-caps with hyphen)
            host = re.search(r"\b([A-Z][A-Z0-9-]{2,})\b", text)
            if host:
                return host.group()
            # Look for IPs
            ip = re.search(r"\b\d{1,3}(?:\.\d{1,3}){3}\b", text)
            if ip:
                return ip.group()

        return "jsmith@corp.com"  # Demo default — always produces rich fixture data
