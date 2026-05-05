import re
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.comparative import compare_entity

_DEFAULT_ENTITY = "jsmith@corp.com"

_ENTITY_RE = re.compile(
    r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|'
    r'SERVER-[A-Z0-9]+|FILE-[A-Z0-9]+|DESKTOP-[A-Z0-9]+|BACKUP-[A-Z0-9]+)\b',
    re.IGNORECASE,
)

_WINDOW_MAP = {
    "1h": "1h", "6h": "6h", "12h": "12h",
    "24h": "24h", "today": "24h",
    "7d": "7d", "week": "7d", "30d": "30d",
}


def _extract_window(text: str) -> str:
    for kw, val in _WINDOW_MAP.items():
        if kw in text.lower():
            return val
    return "24h"


class ComparativeHandler(BaseHandler):
    name = "comparative"
    description = "Compare entity behavior against baseline and surface behavioral deviations"
    trigger_phrases = [
        "compare", "baseline", "deviation", "anomalous behavior",
        "behavioral analysis", "how does this compare",
        "peer comparison", "peer percentile", "is this normal",
        "is this unusual", "outlier", "deviation score",
        "how anomalous", "behavior over time", "compare behavior",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        user_text = ctx.query_history[-1].original_text if ctx.query_history else ""
        m = _ENTITY_RE.search(user_text)
        entity = m.group(1) if m else (ctx.active_entities[0].value if ctx.active_entities else _DEFAULT_ENTITY)
        window = _extract_window(user_text)

        yield {
            "type": "progress",
            "message": f"Loading baseline metrics for {entity}...",
            "step": 1,
            "total_steps": 3,
        }

        yield {
            "type": "progress",
            "message": "Computing behavioral deviations vs org baseline...",
            "step": 2,
            "total_steps": 3,
        }

        result = await compare_entity(entity, window)

        yield {
            "type": "progress",
            "message": "Analysis complete.",
            "step": 3,
            "total_steps": 3,
        }

        anomalies = [m for m in result.metrics if m.anomaly]
        lines = [
            f"## Behavioral Analysis: {result.entity}\n",
            f"**Window:** {result.comparison_window}  "
            f"**Deviation Score:** {result.overall_deviation_score}/100  "
            f"**Peer Percentile:** {result.peer_percentile}th\n",
        ]

        if anomalies:
            lines.append(f"### Anomalous Metrics ({len(anomalies)} detected)")
            for metric in anomalies:
                lines.append(
                    f"- **{metric.metric_name}**: {metric.current_value} "
                    f"vs baseline {metric.baseline_value} "
                    f"({metric.deviation_pct:+.1f}%, σ={metric.sigma})"
                )
            lines.append("")

        lines.append("### Analyst Narrative")
        lines.append(result.narrative)

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": True,
        }
