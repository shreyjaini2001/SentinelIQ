from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.threat_hunt import run_hunt


class HuntHandler(BaseHandler):
    name = "hunt"
    description = "Run a structured threat hunt for a specific threat actor or TTP"
    trigger_phrases = ["hunt", "threat hunt", "lapsus", "scattered spider", "ttp", "mitre", "look for signs"]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        last_query = ctx.query_history[-1].original_text if ctx.query_history else "general threat hunt"

        yield {"type": "progress", "message": "Resolving threat actor TTPs...", "step": 1, "total_steps": 4}

        result = await run_hunt.__wrapped__(last_query) if hasattr(run_hunt, "__wrapped__") else await run_hunt(last_query, "7d")

        yield {"type": "progress", "message": f"Executing {result.techniques_queried} technique queries...", "step": 2, "total_steps": 4}
        yield {"type": "progress", "message": "Clustering findings...", "step": 3, "total_steps": 4}

        lines = [f"## Threat Hunt Results\n"]
        if result.threat_actor:
            lines.append(f"**Target:** {result.threat_actor.title()} TTPs\n")
        lines.append(f"**Techniques queried:** {result.techniques_queried}")
        lines.append(f"**Techniques with evidence:** {result.techniques_with_evidence}\n")

        for tr in result.technique_results:
            icon = {"confirmed": "RED", "suspected": "YELLOW", "not_found": "GREY"}[tr.evidence_level]
            lines.append(f"[{icon}] {tr.technique_id} — {tr.technique_name} ({tr.tactic}): {tr.evidence_level} ({tr.event_count} events)")

        lines.append(f"\n---\n\n{result.narrative}")

        yield {"type": "progress", "message": "Hunt complete.", "step": 4, "total_steps": 4}
        yield {"type": "result", "handler": self.name, "output": "\n".join(lines), "data": result.model_dump(), "session_updated": True}
