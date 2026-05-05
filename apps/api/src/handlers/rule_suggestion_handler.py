from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.rule_suggestion import suggest_rule


def _build_context(ctx: SessionContext) -> str:
    lines = []

    if ctx.active_entities:
        lines.append("Entities: " + ", ".join(f"{e.value} ({e.type})" for e in ctx.active_entities))

    if ctx.query_history:
        lines.append("\nRecent queries that informed this rule:")
        for q in ctx.query_history[-3:]:
            lines.append(f"  - {q.original_text}")
            if q.generated_query:
                lines.append(f"    KQL: {q.generated_query[:120]}...")

    if ctx.compressed_summary:
        lines.append(f"\nInvestigation summary: {ctx.compressed_summary}")

    if not lines:
        user_text = ""
        if ctx.query_history:
            user_text = ctx.query_history[-1].original_text
        lines.append(f"Create a detection rule for: {user_text or 'the current investigation pattern'}")

    return "\n".join(lines)


class RuleSuggestionHandler(BaseHandler):
    name = "rule_suggestion"
    description = "Generate an enhanced KQL detection rule with FP rate, backtest, and similar rules"
    trigger_phrases = [
        "write a rule", "create a rule", "create rule", "detection rule",
        "kql rule", "write a detection", "create detection",
        "turn this into a rule", "create an alert rule",
        "suggest a rule", "rule for this", "rule for this pattern",
        "detection for", "alert rule",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        yield {
            "type": "progress",
            "message": "Analyzing investigation context for rule generation...",
            "step": 1,
            "total_steps": 4,
        }

        context_text = _build_context(ctx)

        yield {
            "type": "progress",
            "message": "Generating KQL detection rule with AI...",
            "step": 2,
            "total_steps": 4,
        }

        result = await suggest_rule(context_text)

        yield {
            "type": "progress",
            "message": "Running simulated backtest and similarity search...",
            "step": 3,
            "total_steps": 4,
        }

        yield {
            "type": "progress",
            "message": "Rule ready for review.",
            "step": 4,
            "total_steps": 4,
        }

        lines = [
            f"## Detection Rule: {result.rule_name}\n",
            f"**Severity:** {result.severity.upper()}  "
            f"**Est. FP Rate:** {result.estimated_fp_rate * 100:.0f}%\n",
            f"**MITRE ATT&CK:** {', '.join(result.technique_ids)}  "
            f"**Tactics:** {', '.join(result.mitre_tactics)}\n",
            "### KQL Rule",
            f"```kql\n{result.kql}\n```\n",
            "### Backtest (30-day simulation)",
            f"- Total alerts: {result.backtest.alert_count}",
            f"- Estimated TP: {result.backtest.tp_count}",
            f"- Estimated FP: {result.backtest.fp_count} ({result.backtest.estimated_fp_rate * 100:.0f}%)\n",
            "### False Positive Guidance",
            result.false_positive_guidance + "\n",
        ]

        if result.tuning_recommendations:
            lines.append("### Tuning Recommendations")
            for rec in result.tuning_recommendations:
                lines.append(f"- {rec}")
            lines.append("")

        if result.similar_rules:
            lines.append("### Similar Existing Rules")
            for sr in result.similar_rules:
                lines.append(f"- **{sr.name}** (similarity: {int(sr.similarity_score * 100)}%, techs: {', '.join(sr.technique_ids)})")

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": False,
        }
