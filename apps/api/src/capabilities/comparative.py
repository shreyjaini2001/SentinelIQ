"""
Capability 6 — Comparative Behavioral Analysis
PRD §6.6: Compares entity behavior vs baseline, surfaces deviations with peer percentile.
"""

import uuid
import math
from datetime import datetime, timezone
from pydantic import BaseModel
from src.llm import client as llm
from src.providers import get_data_provider
from config import settings

_COMPARATIVE_SYSTEM = (
    "You are SentinelIQ's behavioral analytics AI. "
    "You receive deviation metrics for a security entity and write a 2-3 paragraph analyst narrative. "
    "Lead with the most significant anomaly. Quantify deviations. "
    "Recommend next investigative steps. comparative behavioral analysis"
)


class DeviationMetric(BaseModel):
    metric_name: str
    current_value: float
    baseline_value: float
    deviation_pct: float
    sigma: float
    anomaly: bool


class ComparativeResult(BaseModel):
    comparative_id: str
    entity: str
    comparison_window: str
    metrics: list[DeviationMetric]
    peer_percentile: int  # 0-100 (higher = more anomalous vs peers)
    overall_deviation_score: int  # 0-100
    narrative: str
    duration_ms: int


# Simulated "current" elevated metrics for the compromised jsmith scenario
_ENTITY_OVERRIDES: dict[str, dict] = {
    "jsmith": {
        "daily_logins": 14.0,
        "failed_logins": 7.0,
        "off_hours_logins": 5.0,
        "outbound_bytes_mb": 312.0,
        "unique_hosts_accessed": 9.0,
        "encoded_ps_count": 3.0,
        "geo_countries": 3.0,
    },
    "jsmith@corp.com": {
        "daily_logins": 14.0,
        "failed_logins": 7.0,
        "off_hours_logins": 5.0,
        "outbound_bytes_mb": 312.0,
        "unique_hosts_accessed": 9.0,
        "encoded_ps_count": 3.0,
        "geo_countries": 3.0,
    },
    "server-dc01": {
        "daily_logins": 38.0,
        "failed_logins": 12.0,
        "off_hours_logins": 8.0,
        "outbound_bytes_mb": 587.0,
        "unique_hosts_accessed": 14.0,
        "encoded_ps_count": 2.0,
        "geo_countries": 1.0,
    },
}

_DEFAULT_CURRENT: dict[str, float] = {
    "daily_logins": 4.5,
    "failed_logins": 0.9,
    "off_hours_logins": 0.3,
    "outbound_bytes_mb": 53.0,
    "unique_hosts_accessed": 2.4,
    "encoded_ps_count": 2.0,
    "geo_countries": 1.0,
}


def _sigma(current: float, baseline: float, std_dev_factor: float = 0.2) -> float:
    """Estimate sigma given a simple proportional std deviation."""
    std = max(baseline * std_dev_factor, 0.1)
    return round(abs(current - baseline) / std, 2)


def _compute_metrics(entity_lower: str, dp) -> list[DeviationMetric]:
    baselines = dp.get_baselines()
    auth_b = baselines.get("auth", {})
    net_b = baselines.get("network", {})
    proc_b = baselines.get("process", {})
    ub = baselines.get("user_behavior", {})

    # Baseline values
    bl: dict[str, float] = {
        "daily_logins": float(auth_b.get("avg_daily_logins_per_user", 4.2)),
        "failed_logins": float(auth_b.get("avg_failed_logins_per_user_per_day", 0.8)),
        "off_hours_logins": float(auth_b.get("off_hours_login_rate", 0.04)) * 10,
        "outbound_bytes_mb": float(net_b.get("avg_outbound_bytes_per_host_per_day", 52428800)) / 1048576,
        "unique_hosts_accessed": float(ub.get("avg_unique_hosts_accessed_per_user_per_day", 2.3)),
        "encoded_ps_count": float(proc_b.get("encoded_powershell_rate_per_day", 2.1)),
        "geo_countries": 1.0,
    }

    # Current values
    curr = _ENTITY_OVERRIDES.get(entity_lower, _DEFAULT_CURRENT)

    labels = {
        "daily_logins": "Daily Login Count",
        "failed_logins": "Failed Login Attempts",
        "off_hours_logins": "Off-Hours Login Events",
        "outbound_bytes_mb": "Outbound Data (MB/day)",
        "unique_hosts_accessed": "Unique Hosts Accessed",
        "encoded_ps_count": "Encoded PowerShell Executions",
        "geo_countries": "Distinct Login Countries",
    }

    metrics: list[DeviationMetric] = []
    for key, label in labels.items():
        c = curr.get(key, bl[key])
        b = bl[key]
        dev_pct = round(((c - b) / max(b, 0.001)) * 100, 1)
        sig = _sigma(c, b)
        anomaly = sig >= 2.0 or abs(dev_pct) >= 100
        metrics.append(DeviationMetric(
            metric_name=label,
            current_value=round(c, 2),
            baseline_value=round(b, 2),
            deviation_pct=dev_pct,
            sigma=sig,
            anomaly=anomaly,
        ))

    return metrics


def _overall_score(metrics: list[DeviationMetric]) -> int:
    if not metrics:
        return 0
    anomaly_count = sum(1 for m in metrics if m.anomaly)
    max_sigma = max(m.sigma for m in metrics)
    score = min(100, int((anomaly_count / len(metrics)) * 60 + min(max_sigma * 5, 40)))
    return score


def _peer_percentile(score: int) -> int:
    """Map deviation score to a peer percentile (higher = more anomalous than peers)."""
    if score >= 80:
        return 99
    if score >= 60:
        return 95
    if score >= 40:
        return 85
    if score >= 20:
        return 70
    return 55


async def compare_entity(entity: str, window: str = "24h") -> ComparativeResult:
    start = datetime.now(timezone.utc)
    dp = get_data_provider()
    entity_lower = entity.lower().strip()

    metrics = _compute_metrics(entity_lower, dp)
    score = _overall_score(metrics)
    percentile = _peer_percentile(score)

    # Summarize for LLM
    anomalies = [m for m in metrics if m.anomaly]
    summary_lines = [f"Entity: {entity}", f"Analysis window: {window}"]
    for m in metrics:
        flag = "⚠ ANOMALY" if m.anomaly else "OK"
        summary_lines.append(
            f"  {m.metric_name}: current={m.current_value}, baseline={m.baseline_value}, "
            f"deviation={m.deviation_pct:+.1f}%, sigma={m.sigma} {flag}"
        )
    summary_lines.append(f"Overall deviation score: {score}/100")
    summary_lines.append(f"Peer percentile: {percentile}th (more anomalous than {percentile}% of peers)")

    narrative = await llm.complete(
        messages=[{"role": "user", "content": "\n".join(summary_lines)}],
        system=_COMPARATIVE_SYSTEM,
        model=settings.action_model,
        max_tokens=512,
        use_cache=True,
    )

    end = datetime.now(timezone.utc)
    duration_ms = int((end - start).total_seconds() * 1000)

    return ComparativeResult(
        comparative_id=str(uuid.uuid4()),
        entity=entity,
        comparison_window=window,
        metrics=metrics,
        peer_percentile=percentile,
        overall_deviation_score=score,
        narrative=narrative,
        duration_ms=duration_ms,
    )
