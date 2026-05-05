"""
Capability 1 — Natural Language Alert Triage
PRD §6.1: Scores alerts by TP/FP probability with explainability.
"""

import json
import asyncio
import re
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Literal
from src.llm import client as llm
from config import settings

_TRIAGE_SYSTEM = """You are SentinelIQ's alert triage AI. You score security alerts for true positive (TP) vs false positive (FP) probability.

For each alert, output JSON matching this exact schema:
{
  "alert_id": "<same id as input>",
  "fp_probability": <integer 0-100>,
  "tp_probability": <integer 0-100>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<2-3 sentence plain English explanation>",
  "influencing_fields": ["<field1>", "<field2>"]
}

Rules:
- fp_probability + tp_probability should sum to ~100
- high confidence: the evidence clearly points one way
- medium confidence: some ambiguity
- low confidence: insufficient context
- influencing_fields: the specific log fields that most determined your verdict (e.g. "CountryOrRegion", "ResultType")
- Return ONLY valid JSON, no markdown fences"""


class AlertInput(BaseModel):
    alert_id: str
    title: str
    severity: Literal["critical", "high", "medium", "low"]
    rule_name: str
    raw_log: dict
    entity: str
    timestamp: str


class TriageVerdict(BaseModel):
    alert_id: str
    fp_probability: int
    tp_probability: int
    confidence: Literal["high", "medium", "low"]
    reasoning: str
    influencing_fields: list[str]


class TriageResult(BaseModel):
    verdicts: list[TriageVerdict]
    total_alerts: int
    likely_tp: int
    likely_fp: int
    uncertain: int
    duration_ms: int


async def _score_alert(alert: AlertInput) -> TriageVerdict:
    user_content = (
        f"Alert ID: {alert.alert_id}\n"
        f"Rule: {alert.rule_name}\n"
        f"Title: {alert.title}\n"
        f"Severity: {alert.severity}\n"
        f"Entity: {alert.entity}\n"
        f"Timestamp: {alert.timestamp}\n"
        f"Raw log fields:\n{json.dumps(alert.raw_log, indent=2)}"
    )
    raw = await llm.complete(
        messages=[{"role": "user", "content": user_content}],
        system=_TRIAGE_SYSTEM,
        model=settings.nlq_model,
        max_tokens=256,
        use_cache=True,
    )
    return _parse_verdict(raw, alert.alert_id)


def _parse_verdict(raw: str, alert_id: str) -> TriageVerdict:
    try:
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        data = json.loads(cleaned)
        return TriageVerdict(
            alert_id=alert_id,
            fp_probability=int(data.get("fp_probability", 50)),
            tp_probability=int(data.get("tp_probability", 50)),
            confidence=data.get("confidence", "medium"),
            reasoning=data.get("reasoning", "Insufficient context for scoring."),
            influencing_fields=data.get("influencing_fields", []),
        )
    except (json.JSONDecodeError, ValueError):
        return TriageVerdict(
            alert_id=alert_id,
            fp_probability=50,
            tp_probability=50,
            confidence="low",
            reasoning="Scoring failed — manual review required.",
            influencing_fields=[],
        )


async def triage_alerts(alerts: list[AlertInput]) -> TriageResult:
    start = datetime.now(timezone.utc)

    # Process in parallel, max 20 concurrent (rate limit protection)
    semaphore = asyncio.Semaphore(20)

    async def score_with_limit(alert: AlertInput) -> TriageVerdict:
        async with semaphore:
            return await _score_alert(alert)

    verdicts = await asyncio.gather(*[score_with_limit(a) for a in alerts])
    verdicts_sorted = sorted(verdicts, key=lambda v: v.tp_probability, reverse=True)

    end = datetime.now(timezone.utc)
    duration_ms = int((end - start).total_seconds() * 1000)

    likely_tp = sum(1 for v in verdicts if v.tp_probability >= 70)
    likely_fp = sum(1 for v in verdicts if v.fp_probability >= 70)
    uncertain = len(verdicts) - likely_tp - likely_fp

    return TriageResult(
        verdicts=verdicts_sorted,
        total_alerts=len(alerts),
        likely_tp=likely_tp,
        likely_fp=likely_fp,
        uncertain=uncertain,
        duration_ms=duration_ms,
    )


def make_sample_alerts(n: int = 5) -> list[AlertInput]:
    """Load fixture alerts via DataProvider (fixture mode) or fall back to hardcoded samples."""
    try:
        from src.providers import get_data_provider
        raw = get_data_provider().get_alerts(n)
        alerts = []
        for r in raw:
            alerts.append(AlertInput(
                alert_id=r.get("alert_id", str(uuid.uuid4())),
                title=r["title"],
                severity=r["severity"],
                rule_name=r["rule_name"],
                raw_log=r.get("raw_log", {}),
                entity=r["entity"],
                timestamp=r.get("timestamp", datetime.now(timezone.utc).isoformat()),
            ))
        return alerts[:n]
    except Exception:
        # Fallback to minimal hardcoded set if provider fails
        return [
            AlertInput(
                alert_id=str(uuid.uuid4()),
                title="Failed login from unusual country",
                severity="high",
                rule_name="GeoAnomalyLogin",
                raw_log={"UserPrincipalName": "jsmith@corp.com", "CountryOrRegion": "RU", "ResultType": "50126", "IPAddress": "185.220.101.45"},
                entity="jsmith@corp.com",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ),
            AlertInput(
                alert_id=str(uuid.uuid4()),
                title="New local admin account created",
                severity="critical",
                rule_name="LocalAdminCreation",
                raw_log={"EventID": "4720", "TargetUserName": "helpdesk_temp", "Computer": "SERVER-DC01"},
                entity="SERVER-DC01",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ),
        ][:n]
