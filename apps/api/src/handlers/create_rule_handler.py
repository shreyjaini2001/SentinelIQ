from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.llm import client as llm
from config import settings

_SYSTEM = """You are SentinelIQ's detection engineering AI. Given an investigation context,
generate a KQL detection rule that would catch this type of activity.

Structure your output as:
## Detection Rule: [Rule Name]

**Purpose:** [What this detects]

**KQL Rule:**
```kql
[the rule]
```

**Severity:** High | Medium | Low
**MITRE ATT&CK:** [Technique IDs if applicable]
**False Positive Guidance:** [Common FP sources and how to tune]
**Estimated Daily Volume:** [rough estimate]

Generate a practical, deployable rule based on the investigation findings."""


class CreateRuleHandler(BaseHandler):
    name = "create_rule"
    description = "Create a detection rule from the current investigation pattern"
    trigger_phrases = ["create rule", "detection rule", "kql rule", "write a rule", "turn this into", "create detection"]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        yield {"type": "progress", "message": "Analyzing investigation pattern...", "step": 1, "total_steps": 4}

        last_queries = "\n".join(
            f"- {e.original_text}: {e.generated_query}"
            for e in ctx.query_history[-5:]
        )
        entities_str = ", ".join(f"{e.type}:{e.value}" for e in ctx.active_entities)

        user_content = (
            f"Generate a detection rule based on this investigation:\n\n"
            f"Recent queries:\n{last_queries or 'No queries yet'}\n\n"
            f"Entities involved: {entities_str or 'None identified'}"
        )

        yield {"type": "progress", "message": "Generating detection rule...", "step": 2, "total_steps": 4}

        output_parts = []
        async for chunk in llm.stream(
            messages=[{"role": "user", "content": user_content}],
            system=_SYSTEM,
            model=settings.action_model,
            max_tokens=1500,
        ):
            output_parts.append(chunk)

        yield {"type": "progress", "message": "Estimating false positive rate...", "step": 3, "total_steps": 4}
        yield {"type": "progress", "message": "Rule ready for review.", "step": 4, "total_steps": 4}
        yield {
            "type": "result",
            "handler": self.name,
            "output": "".join(output_parts),
            "session_updated": True,
        }
