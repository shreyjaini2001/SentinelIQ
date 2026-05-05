"""
Capability 5 — One-Click Documentation
PRD §6.5: Generates technical, executive, or regulatory incident reports.
"""

import uuid
from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel
from src.llm import client as llm
from config import settings

Variant = Literal["technical", "executive", "regulatory"]

_SYSTEMS: dict[str, str] = {
    "technical": (
        "You are SentinelIQ's technical documentation AI. "
        "Generate a detailed technical incident report in Markdown. "
        "Include: executive overview, timeline of events, affected systems, "
        "attack chain analysis, forensic artifacts, and remediation steps. "
        "documentation technical"
    ),
    "executive": (
        "You are SentinelIQ's executive briefing AI. "
        "Generate a concise executive summary suitable for a CISO or board audience. "
        "No jargon. Quantify business impact. Lead with the most important finding. "
        "documentation executive"
    ),
    "regulatory": (
        "You are SentinelIQ's compliance documentation AI. "
        "Generate a regulatory breach notification report. "
        "Include: incident description, data types potentially affected, "
        "timeline, containment actions, and regulatory notification obligations. "
        "documentation regulatory"
    ),
}


class DocSection(BaseModel):
    heading: str
    body: str


class DocumentationResult(BaseModel):
    doc_id: str
    variant: Variant
    title: str
    sections: list[DocSection]
    raw_markdown: str
    generated_at: str
    entity_scope: str
    duration_ms: int


def _parse_sections(markdown: str) -> list[DocSection]:
    """Split markdown into sections by H2 headings."""
    sections: list[DocSection] = []
    current_heading = "Overview"
    current_lines: list[str] = []

    for line in markdown.splitlines():
        if line.startswith("## "):
            if current_lines:
                sections.append(DocSection(
                    heading=current_heading,
                    body="\n".join(current_lines).strip(),
                ))
                current_lines = []
            current_heading = line[3:].strip()
        else:
            current_lines.append(line)

    if current_lines:
        sections.append(DocSection(heading=current_heading, body="\n".join(current_lines).strip()))

    return sections if sections else [DocSection(heading="Report", body=markdown.strip())]


async def generate_documentation(
    variant: Variant,
    entity_scope: str,
    context_text: str,
) -> DocumentationResult:
    start = datetime.now(timezone.utc)

    user_content = (
        f"Generate a {variant} incident report.\n\n"
        f"Entity scope: {entity_scope}\n\n"
        f"Investigation context:\n{context_text}"
    )

    markdown = await llm.complete(
        messages=[{"role": "user", "content": user_content}],
        system=_SYSTEMS[variant],
        model=settings.action_model,
        max_tokens=1024,
        use_cache=True,
    )

    titles = {
        "technical": f"Technical Incident Report — {entity_scope}",
        "executive": f"Executive Briefing — {entity_scope}",
        "regulatory": f"Regulatory Notification — {entity_scope}",
    }

    sections = _parse_sections(markdown)
    end = datetime.now(timezone.utc)
    duration_ms = int((end - start).total_seconds() * 1000)

    return DocumentationResult(
        doc_id=str(uuid.uuid4()),
        variant=variant,
        title=titles[variant],
        sections=sections,
        raw_markdown=markdown,
        generated_at=start.isoformat(),
        entity_scope=entity_scope,
        duration_ms=duration_ms,
    )
