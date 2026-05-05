from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.triage import triage_alerts, make_sample_alerts


class TriageHandler(BaseHandler):
    name = "triage"
    description = "Triage open alerts and score them for true/false positive probability"
    trigger_phrases = ["triage", "score alerts", "false positive", "which alerts", "score these"]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        yield {"type": "progress", "message": "Loading alerts from queue...", "step": 1, "total_steps": 3}

        # Use sample alerts for now — real alert integration in Phase 1+
        alerts = make_sample_alerts(5)

        yield {"type": "progress", "message": f"Scoring {len(alerts)} alerts with AI...", "step": 2, "total_steps": 3}

        result = await triage_alerts(alerts)

        yield {"type": "progress", "message": "Triage complete.", "step": 3, "total_steps": 3}

        # Format output
        lines = [f"## Alert Triage Results\n",
                 f"**{result.total_alerts} alerts scored** in {result.duration_ms}ms\n",
                 f"- Likely TP (action needed): **{result.likely_tp}**",
                 f"- Likely FP (can dismiss): **{result.likely_fp}**",
                 f"- Uncertain (review required): **{result.uncertain}**\n",
                 "---\n"]

        for v in result.verdicts:
            badge = "🔴 LIKELY TP" if v.tp_probability >= 70 else ("⚪ LIKELY FP" if v.fp_probability >= 70 else "🟡 UNCERTAIN")
            lines.append(f"**Alert {v.alert_id[:8]}...** — {badge}")
            lines.append(f"TP: {v.tp_probability}% | FP: {v.fp_probability}% | Confidence: {v.confidence}")
            lines.append(f"{v.reasoning}")
            if v.influencing_fields:
                lines.append(f"Key fields: {', '.join(v.influencing_fields)}")
            lines.append("")

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": True,
        }
