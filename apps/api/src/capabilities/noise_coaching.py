"""
Capability 10 — Noise Reduction Coaching
PRD §7.3: Analyzes noisy detection rules and recommends targeted tuning.
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from src.llm import client as llm
from src.providers import get_data_provider
from config import settings

_NOISE_SYSTEM = (
    "You are SentinelIQ's noise reduction coaching AI. "
    "Write a 3-4 sentence impact preview for the proposed tuning changes. "
    "Explain: what FP clusters are being eliminated, expected reduction, and detection coverage preserved. "
    "Be specific and use numbers where possible. "
    "noise reduction coaching"
)

# Field-level FP analysis per rule type
_RULE_FP_PROFILES: dict[str, dict] = {
    "GeoAnomalyLogin": {
        "clusters": [
            {"desc": "Corporate VPN exit nodes appearing as foreign countries", "count": 14, "fields": {"CountryOrRegion": "multiple", "IPAddress": "10.0.0.0/8 range via proxy"}},
            {"desc": "Business travel logins from known-employee travel locations", "count": 9, "fields": {"CountryOrRegion": "GB,FR,DE", "UserPrincipalName": "executives"}},
            {"desc": "Third-party OAuth flows using geo-diverse relay infrastructure", "count": 6, "fields": {"ClientAppUsed": "MSAL", "UserAgent": "OAuth2"}},
        ],
        "top_fp_fields": ["CountryOrRegion", "IPAddress", "ClientAppUsed", "UserAgent", "UserPrincipalName"],
        "recommendations": [
            {"field": "IPAddress", "condition": "!in (corporate_vpn_ranges)", "reduction": 0.28, "rationale": "Corporate VPN IPs consistently flagged as foreign — allowlist resolves 28% of FPs"},
            {"field": "CountryOrRegion", "condition": "not in executive_travel_calendar", "reduction": 0.19, "rationale": "Executive travel accounts for 19% of geo alerts — integrate travel calendar API"},
            {"field": "ClientAppUsed", "condition": "!in ('MSAL', 'Modern Authentication')", "reduction": 0.14, "rationale": "OAuth relay apps geo-randomize — exclude modern auth clients with known good tokens"},
        ],
        "before_fp_rate": 0.12,
        "after_fp_rate": 0.04,
        "reduction_pct": 0.65,
        "rollback": "Revert IP allowlist condition in KQL; re-enable country match on all traffic. Change can be toggled via Sentinel Watchlist.",
    },
    "EncodedPowerShell": {
        "clusters": [
            {"desc": "Monitoring agents using encoded commands for configuration payload delivery", "count": 8, "fields": {"InitiatingProcessFileName": "services.exe", "AccountName": "SYSTEM"}},
            {"desc": "CI/CD pipeline runners executing encoded deployment scripts", "count": 6, "fields": {"DeviceName": "BUILDAGENT-*", "AccountName": "svc-build"}},
            {"desc": "Admin automation tools (Ansible, SaltStack) using encoded PowerShell", "count": 4, "fields": {"ProcessCommandLine": "known-good base64 hashes", "AccountName": "svc-ansible"}},
        ],
        "top_fp_fields": ["InitiatingProcessFileName", "AccountName", "DeviceName", "ProcessCommandLine"],
        "recommendations": [
            {"field": "AccountName", "condition": "!in ('SYSTEM', 'svc-build', 'svc-ansible', 'svc-monitor')", "reduction": 0.35, "rationale": "Known service accounts drive 35% of FPs — allowlisting eliminates systematic noise"},
            {"field": "DeviceName", "condition": "!startswith 'BUILDAGENT'", "reduction": 0.15, "rationale": "Build agent pool consistently generates FPs — exclude by device name pattern"},
            {"field": "ProcessCommandLine", "condition": "!in (approved_base64_hashes_watchlist)", "reduction": 0.12, "rationale": "Maintain Sentinel Watchlist of approved encoded hashes; block-list new additions via PR"},
        ],
        "before_fp_rate": 0.28,
        "after_fp_rate": 0.09,
        "reduction_pct": 0.40,
        "rollback": "Remove AccountName and DeviceName exclusions from KQL WHERE clause. Approved-hash watchlist can be cleared independently without rule change.",
    },
    "CredentialDumping": {
        "clusters": [
            {"desc": "Antivirus/EDR agents performing legitimate LSASS memory reads for signature scanning", "count": 3, "fields": {"InitiatingProcessFileName": "MsMpEng.exe", "InitiatingProcessAccountName": "SYSTEM"}},
        ],
        "top_fp_fields": ["InitiatingProcessFileName", "InitiatingProcessAccountName"],
        "recommendations": [
            {"field": "InitiatingProcessFileName", "condition": "!in ('MsMpEng.exe', 'SenseIR.exe', 'csrss.exe')", "reduction": 0.30, "rationale": "Known security tools reading LSASS — these have signed binaries and should be allowlisted"},
        ],
        "before_fp_rate": 0.04,
        "after_fp_rate": 0.02,
        "reduction_pct": 0.30,
        "rollback": "Remove InitiatingProcessFileName exclusion. Rule sensitivity returns to baseline.",
    },
}

_DEFAULT_PROFILE = _RULE_FP_PROFILES["GeoAnomalyLogin"]

# Fallback rules used when the data provider raises NotImplementedError
_FALLBACK_RULES: list[dict] = [
    {"rule_id": "RULE-001", "name": "GeoAnomalyLogin",   "description": "Geo-anomaly login detection", "false_positive_rate": 0.12, "technique_ids": ["T1078"]},
    {"rule_id": "RULE-002", "name": "EncodedPowerShell", "description": "Encoded PowerShell detection", "false_positive_rate": 0.28, "technique_ids": ["T1059"]},
    {"rule_id": "RULE-003", "name": "CredentialDumping", "description": "LSASS credential dumping",     "false_positive_rate": 0.04, "technique_ids": ["T1003"]},
]

# Rule name aliases: variant names → canonical fixture rule name
_RULE_ALIASES: dict[str, str] = {
    "GeoAnomalyNewCountryLogin": "GeoAnomalyLogin",
    "GeoAnomalyNewCountry": "GeoAnomalyLogin",
}


class FPCluster(BaseModel):
    cluster_id: str
    description: str
    alert_count: int
    representative_fields: dict


class TuningRecommendation(BaseModel):
    recommendation_id: str
    field_name: str
    suggested_condition: str
    estimated_reduction_pct: float
    rationale: str


class NoiseCoachingResult(BaseModel):
    coaching_id: str
    rule_name: str
    rule_description: str
    current_fp_rate: float
    fp_clusters: list[FPCluster]
    top_fp_fields: list[str]
    tuning_recommendations: list[TuningRecommendation]
    estimated_alert_reduction_pct: float
    before_fp_rate: float
    after_fp_rate: float
    impact_preview: str
    rollback_notes: str
    duration_ms: int


def _find_rule(rules: list[dict], text: str) -> dict | None:
    text_lower = text.lower()
    for rule in rules:
        if rule.get("name", "").lower() in text_lower:
            return rule
        for tid in rule.get("technique_ids", []):
            if tid.lower() in text_lower:
                return rule
    return None


async def analyze_noise(
    context_text: str,
    rule_name_hint: str = "",
) -> NoiseCoachingResult:
    start = datetime.now(timezone.utc)
    dp = get_data_provider()

    try:
        rules = dp.get_detection_rules()
        alerts = dp.get_alerts(n=20)
    except NotImplementedError:
        rules = _FALLBACK_RULES
        alerts = []

    # Resolve known aliases before fixture lookup
    rule_name_hint = _RULE_ALIASES.get(rule_name_hint, rule_name_hint)

    search_text = f"{context_text} {rule_name_hint}".strip()
    matched_rule = _find_rule(rules, search_text)

    if not matched_rule:
        # Default to highest-FP-rate rule
        matched_rule = max(rules, key=lambda r: r.get("false_positive_rate", 0), default=rules[0] if rules else {})

    rule_name = matched_rule.get("name", "Unknown Rule")
    rule_desc = matched_rule.get("description", "No description available.")
    current_fp_rate = matched_rule.get("false_positive_rate", 0.12)

    profile = _RULE_FP_PROFILES.get(rule_name, _DEFAULT_PROFILE)

    fp_clusters = [
        FPCluster(
            cluster_id=f"FPC-{i + 1:03d}",
            description=c["desc"],
            alert_count=c["count"],
            representative_fields=c["fields"],
        )
        for i, c in enumerate(profile["clusters"])
    ]

    tuning_recommendations = [
        TuningRecommendation(
            recommendation_id=f"REC-{i + 1:03d}",
            field_name=r["field"],
            suggested_condition=r["condition"],
            estimated_reduction_pct=r["reduction"],
            rationale=r["rationale"],
        )
        for i, r in enumerate(profile["recommendations"])
    ]

    llm_context = (
        f"Rule: {rule_name}. Current FP rate: {current_fp_rate:.0%}. "
        f"FP clusters: {', '.join(c.description for c in fp_clusters)}. "
        f"Recommended actions: {', '.join(r.field_name for r in tuning_recommendations)}. "
        f"Projected reduction: {profile['reduction_pct']:.0%}. After FP rate: {profile['after_fp_rate']:.0%}."
    )

    impact_preview = await llm.complete(
        messages=[{"role": "user", "content": llm_context}],
        system=_NOISE_SYSTEM,
        model=settings.action_model,
        max_tokens=256,
        use_cache=True,
    )

    end = datetime.now(timezone.utc)

    return NoiseCoachingResult(
        coaching_id=str(uuid.uuid4()),
        rule_name=rule_name,
        rule_description=rule_desc,
        current_fp_rate=current_fp_rate,
        fp_clusters=fp_clusters,
        top_fp_fields=profile["top_fp_fields"],
        tuning_recommendations=tuning_recommendations,
        estimated_alert_reduction_pct=profile["reduction_pct"],
        before_fp_rate=profile["before_fp_rate"],
        after_fp_rate=profile["after_fp_rate"],
        impact_preview=impact_preview,
        rollback_notes=profile["rollback"],
        duration_ms=int((end - start).total_seconds() * 1000),
    )
