from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.runbook import generate_runbook


class RunbookHandler(BaseHandler):
    name = "runbook"
    description = "Generate a structured incident response runbook for a given alert type or scenario"
    trigger_phrases = [
        "runbook", "run book",
        "generate a runbook", "create a runbook", "write a runbook",
        "create a playbook for", "generate a playbook",
        "runbook for", "playbook for",
        "incident response playbook", "response runbook",
        "runbook based on", "step-by-step response",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        user_text = ctx.last_action_text or (
            ctx.query_history[-1].original_text if ctx.query_history else ""
        )

        yield {
            "type": "progress",
            "message": "Detecting incident scenario from context...",
            "step": 1,
            "total_steps": 4,
        }

        # Build context from session
        context_lines: list[str] = [user_text]
        if ctx.active_entities:
            context_lines.append("Entities: " + ", ".join(e.value for e in ctx.active_entities[:5]))
        if ctx.query_history:
            for q in ctx.query_history[-3:]:
                context_lines.append(f"Prior query: {q.original_text}")
        if ctx.compressed_summary:
            context_lines.append(f"Session: {ctx.compressed_summary}")
        context_text = "\n".join(context_lines)

        yield {
            "type": "progress",
            "message": "Loading response steps and related ATT&CK techniques...",
            "step": 2,
            "total_steps": 4,
        }

        yield {
            "type": "progress",
            "message": "Generating runbook narrative...",
            "step": 3,
            "total_steps": 4,
        }

        result = await generate_runbook(context_text=context_text)

        yield {
            "type": "progress",
            "message": f"Runbook ready — {len(result.steps)} steps, ~{result.estimated_total_minutes} min total.",
            "step": 4,
            "total_steps": 4,
        }

        lines = [
            f"## {result.title}\n",
            f"**Scenario:** {result.scenario}  "
            f"**Alert Type:** {result.alert_type}  "
            f"**Estimated Time:** {result.estimated_total_minutes} min\n",
            result.narrative + "\n",
            "### Response Steps",
        ]
        for step in result.steps:
            lines.append(f"\n**Step {step.step_number}: {step.action}**")
            lines.append(f"  - Role: {step.role_owner}")
            lines.append(f"  - Est. time: {step.estimated_minutes} min")
            if step.tools_commands:
                lines.append(f"  - Tools: {', '.join(step.tools_commands[:2])}")
            if step.decision_branch:
                lines.append(f"  - Decision: _{step.decision_branch}_")

        lines += [
            "\n### ATT&CK Techniques",
            ", ".join(result.related_techniques),
            "\n### Similar Past Incidents",
        ]
        for inc in result.similar_incidents:
            lines.append(f"- {inc}")

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": False,
        }
