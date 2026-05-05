import re
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.blast_radius import estimate_blast_radius

_DEFAULT_ENTITY = "jsmith@corp.com"

_ENTITY_PATTERNS = [
    r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b',  # email
    r'\b(SERVER-[A-Z0-9]+|FILE-[A-Z0-9]+|DESKTOP-[A-Z0-9]+|BACKUP-[A-Z0-9]+|DC\d+)\b',  # known hosts
]


def _extract_entity(text: str) -> str:
    for pattern in _ENTITY_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1)
    # Check active_entities in session via ctx — handled by handler
    return ""


class BlastRadiusHandler(BaseHandler):
    name = "blast_radius"
    description = "Estimate blast radius and reachable assets if an entity is compromised"
    trigger_phrases = [
        "blast radius", "what's at risk", "what is at risk",
        "reachable from", "if this account is", "is compromised",
        "access paths", "compromised account", "at risk",
        "scope of compromise", "impact if",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        # Extract entity from latest query text or active entities
        user_text = ctx.query_history[-1].original_text if ctx.query_history else ""
        entity = _extract_entity(user_text)

        if not entity and ctx.active_entities:
            entity = ctx.active_entities[0].value

        if not entity:
            entity = _DEFAULT_ENTITY

        yield {
            "type": "progress",
            "message": f"Resolving entity '{entity}' in IAM graph...",
            "step": 1,
            "total_steps": 3,
        }

        yield {
            "type": "progress",
            "message": "Traversing access paths and privilege escalation routes...",
            "step": 2,
            "total_steps": 3,
        }

        result = estimate_blast_radius(entity)

        yield {
            "type": "progress",
            "message": f"Analysis complete — {result.total_reachable_assets} assets reachable.",
            "step": 3,
            "total_steps": 3,
        }

        lines = [
            f"## Blast Radius: {result.seed_entity}\n",
            f"**Risk Score:** {result.risk_score}/100",
            f"**Reachable Assets:** {result.total_reachable_assets}",
            f"**Scope:** {result.estimated_scope}\n",
        ]

        if result.privileged_paths:
            lines.append("### Privileged Access Paths")
            for path in result.privileged_paths:
                lines.append(f"- `{path['path']}`")
                lines.append(f"  Attack vector: {path['attack_vector']}")
            lines.append("")

        lines.append("### Containment Steps")
        for i, step in enumerate(result.containment_steps, 1):
            lines.append(f"{i}. {step}")

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": True,
        }
