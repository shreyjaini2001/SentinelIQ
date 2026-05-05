import re
from typing import AsyncIterator, Literal
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.documentation import generate_documentation, Variant

_VARIANT_MAP: dict[str, Variant] = {
    "executive": "executive",
    "exec": "executive",
    "board": "executive",
    "ciso": "executive",
    "regulatory": "regulatory",
    "compliance": "regulatory",
    "gdpr": "regulatory",
    "hipaa": "regulatory",
    "breach": "regulatory",
    "notification": "regulatory",
    "technical": "technical",
    "tech": "technical",
    "forensic": "technical",
    "detailed": "technical",
}

_ENTITY_RE = re.compile(
    r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|'
    r'SERVER-[A-Z0-9]+|FILE-[A-Z0-9]+|DESKTOP-[A-Z0-9]+|BACKUP-[A-Z0-9]+)\b',
    re.IGNORECASE,
)


def _pick_variant(text: str) -> Variant:
    text_lower = text.lower()
    for keyword, variant in _VARIANT_MAP.items():
        if keyword in text_lower:
            return variant
    return "technical"


def _build_context(ctx: SessionContext) -> tuple[str, str]:
    lines = []
    entities: list[str] = []

    if ctx.active_entities:
        entity_strs = [f"{e.value} ({e.type})" for e in ctx.active_entities]
        entities = [e.value for e in ctx.active_entities]
        lines.append(f"Active entities: {', '.join(entity_strs)}")

    if ctx.query_history:
        lines.append(f"\nRecent investigation queries ({len(ctx.query_history)} total):")
        for q in ctx.query_history[-5:]:
            lines.append(f"  - [{q.mode}] {q.original_text}")

    if ctx.compressed_summary:
        lines.append(f"\nSession summary: {ctx.compressed_summary}")

    if ctx.active_investigation:
        lines.append(f"\nActive investigation: {ctx.active_investigation}")

    if not lines:
        lines.append("Ongoing security investigation — details being gathered.")
        entities = ["jsmith@corp.com", "SERVER-DC01"]

    scope = ", ".join(entities) if entities else "Active investigation entities"
    return "\n".join(lines), scope


class DocumentationHandler(BaseHandler):
    name = "documentation"
    description = "Generate technical, executive, or regulatory incident documentation"
    trigger_phrases = [
        "write a report", "write a summary", "write a playbook",
        "document this", "document the",
        "executive summary", "executive report",
        "technical report", "technical documentation",
        "regulatory report", "compliance report", "breach notification",
        "generate report", "create report", "create documentation",
        "draft a report", "draft report",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        user_text = ctx.query_history[-1].original_text if ctx.query_history else ""
        variant = _pick_variant(user_text)

        variant_labels = {
            "technical": "Technical Incident Report",
            "executive": "Executive Briefing",
            "regulatory": "Regulatory Notification",
        }
        label = variant_labels[variant]

        yield {
            "type": "progress",
            "message": f"Gathering investigation context for {label}...",
            "step": 1,
            "total_steps": 3,
        }

        context_text, entity_scope = _build_context(ctx)

        yield {
            "type": "progress",
            "message": f"Generating {label} with AI...",
            "step": 2,
            "total_steps": 3,
        }

        result = await generate_documentation(variant, entity_scope, context_text)

        yield {
            "type": "progress",
            "message": "Documentation ready.",
            "step": 3,
            "total_steps": 3,
        }

        yield {
            "type": "result",
            "handler": self.name,
            "output": result.raw_markdown,
            "data": result.model_dump(),
            "session_updated": False,
        }
