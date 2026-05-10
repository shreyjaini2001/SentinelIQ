import re
from typing import AsyncIterator
from src.handlers.base_handler import BaseHandler
from src.models.session import SessionContext
from src.capabilities.noise_coaching import analyze_noise

_RULE_RE = re.compile(
    r'\b(GeoAnomalyLogin|GeoAnomalyNewCountryLogin|EncodedPowerShell|CredentialDumping|'
    r'RULE-\d+|[A-Z][A-Za-z]{3,}(?:Rule|Alert|Detection))\b'
)


def _extract_rule_hint(text: str) -> str:
    m = _RULE_RE.search(text)
    return m.group(1) if m else ""


class NoiseCoachingHandler(BaseHandler):
    name = "noise_coaching"
    description = "Analyze a noisy detection rule and recommend targeted tuning to reduce false positives"
    trigger_phrases = [
        "why does this rule fire", "why does this alert fire",
        "fire so often", "fires so often",
        "fire too often", "fires too often",
        "help me tune", "tune this rule", "tune this alert",
        "too many false positives", "too many alerts from",
        "reduce noise", "reduce alert noise",
        "noise from rule", "noisy rule", "all this noise",
        "alert fatigue",
        "why is this alerting", "why is this rule",
        "false positive rate", "fp rate",
        "false positives from",
    ]

    async def run(self, ctx: SessionContext) -> AsyncIterator[dict]:
        user_text = ctx.last_action_text or (
            ctx.query_history[-1].original_text if ctx.query_history else ""
        )
        rule_hint = _extract_rule_hint(user_text)

        # Resolve "this rule" / "this alert" via session context
        from_session = False
        is_generic_fallback = False

        if not rule_hint:
            if ctx.last_rule_hint:
                rule_hint = ctx.last_rule_hint
                from_session = True
            else:
                is_generic_fallback = True

        if from_session:
            step1_msg = f"No rule in prompt — using last session rule ({rule_hint}) as context..."
        elif is_generic_fallback:
            step1_msg = (
                "No specific rule identified in your prompt or session. "
                "Analyzing the highest-noise rule in your environment as a starting point..."
            )
        else:
            step1_msg = f"Analyzing false positive patterns for {rule_hint}..."

        yield {"type": "progress", "message": step1_msg, "step": 1, "total_steps": 4}
        yield {"type": "progress", "message": "Clustering false positive events by field patterns...", "step": 2, "total_steps": 4}
        yield {"type": "progress", "message": "Generating tuning recommendations and impact preview...", "step": 3, "total_steps": 4}

        context_text = user_text
        if ctx.compressed_summary:
            context_text += f"\n{ctx.compressed_summary}"

        result = await analyze_noise(
            context_text=context_text,
            rule_name_hint=rule_hint,
        )

        # Persist the resolved rule so "this rule" in the next prompt can find it
        ctx.last_rule_hint = result.rule_name

        # When no rule was identified, prepend a visible note to impact_preview
        if is_generic_fallback:
            fallback_note = (
                f"No specific rule was identified in your prompt or session history. "
                f"Showing analysis for {result.rule_name} — the highest-noise rule in your environment. "
                f"To target a specific rule, mention its name (e.g. \"Why does GeoAnomalyLogin fire so often?\")."
                "\n\n"
            )
            result = result.model_copy(
                update={"impact_preview": fallback_note + result.impact_preview}
            )

        yield {
            "type": "progress",
            "message": (
                f"Analysis complete — {result.estimated_alert_reduction_pct:.0%} estimated alert reduction "
                f"({result.before_fp_rate:.0%} → {result.after_fp_rate:.0%} FP rate)."
            ),
            "step": 4,
            "total_steps": 4,
        }

        lines = [
            f"## Noise Reduction Coaching: {result.rule_name}\n",
            f"**Current FP Rate:** {result.current_fp_rate:.0%}  "
            f"**Est. Reduction:** {result.estimated_alert_reduction_pct:.0%}  "
            f"**After Tuning FP Rate:** {result.after_fp_rate:.0%}\n",
            result.impact_preview + "\n",
            "### False Positive Clusters",
        ]
        for cluster in result.fp_clusters:
            lines.append(f"- **{cluster.description}** ({cluster.alert_count} alerts)")

        lines += ["\n### Tuning Recommendations"]
        for rec in result.tuning_recommendations:
            lines.append(
                f"- **{rec.field_name}** `{rec.suggested_condition}` "
                f"— {rec.estimated_reduction_pct:.0%} reduction: {rec.rationale}"
            )

        lines += ["\n### Rollback Plan", result.rollback_notes]

        yield {
            "type": "result",
            "handler": self.name,
            "output": "\n".join(lines),
            "data": result.model_dump(),
            "session_updated": False,
        }
