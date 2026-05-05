"""
Capability 2 — Threat Hunt Mode
PRD §6.2: Orchestrates multi-query hunts against ATT&CK TTPs.
"""

import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Literal
from src.llm import client as llm
from config import settings

def _load_catalog() -> tuple[dict, dict]:
    """Load ATT&CK techniques and threat actors from fixture data (or fall back to hardcoded)."""
    try:
        from src.providers import get_data_provider
        provider = get_data_provider()
        return provider.get_attack_techniques(), provider.get_threat_actors()
    except Exception:
        pass
    # Hardcoded fallback (subset)
    techniques = {
        "T1078": {"name": "Valid Accounts", "tactic": "Initial Access", "table": "SigninLogs", "query_template": "SigninLogs | where TimeGenerated > ago({window}) | where ResultType == 0 | summarize count() by UserPrincipalName, IPAddress, CountryOrRegion | where count_ > 20"},
        "T1059": {"name": "Command and Scripting Interpreter", "tactic": "Execution", "table": "DeviceProcessEvents", "query_template": "DeviceProcessEvents | where TimeGenerated > ago({window}) | where FileName in~ ('powershell.exe','cmd.exe') | where ProcessCommandLine contains '-enc' | project TimeGenerated, DeviceName, ProcessCommandLine"},
        "T1003": {"name": "OS Credential Dumping", "tactic": "Credential Access", "table": "DeviceProcessEvents", "query_template": "DeviceProcessEvents | where TimeGenerated > ago({window}) | where ProcessCommandLine has_any ('sekurlsa','logonpasswords','MiniDump') | project TimeGenerated, DeviceName, ProcessCommandLine"},
        "T1021": {"name": "Remote Services", "tactic": "Lateral Movement", "table": "SecurityEvent", "query_template": "SecurityEvent | where TimeGenerated > ago({window}) | where EventID == 4624 | where LogonType in (3, 10) | summarize count() by Account, Computer"},
        "T1041": {"name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration", "table": "DeviceNetworkEvents", "query_template": "DeviceNetworkEvents | where TimeGenerated > ago({window}) | where RemoteIPType == 'Public' | summarize Bytes=sum(AdditionalFields.BytesSent) by DeviceName, RemoteIP | where Bytes > 50000000"},
    }
    actors = {
        "lapsus$": ["T1078", "T1059", "T1003"],
        "scattered spider": ["T1059", "T1078", "T1021"],
        "conti": ["T1059", "T1021", "T1003", "T1041"],
    }
    return techniques, actors


ATTACK_TECHNIQUES, THREAT_ACTORS = _load_catalog()

_HUNT_NARRATIVE_SYSTEM = """You are SentinelIQ's threat hunt AI. Given hunt results for multiple MITRE ATT&CK techniques,
write a 3-5 paragraph narrative summarizing:
1. What was found and where
2. What was NOT found (and why that's significant)
3. Confidence level in the findings
4. Recommended next investigation steps

Write for a Tier 2 security analyst. Be specific about technique IDs and evidence quality.
Do not use markdown headers — write flowing paragraphs."""


class TechniqueResult(BaseModel):
    technique_id: str
    technique_name: str
    tactic: str
    evidence_level: Literal["confirmed", "suspected", "not_found"]
    event_count: int
    kql_executed: str
    sample_findings: list[dict]


class HuntResult(BaseModel):
    hunt_id: str
    threat_actor: str | None
    techniques_queried: int
    techniques_with_evidence: int
    technique_results: list[TechniqueResult]
    narrative: str
    duration_ms: int
    time_window: str


async def _execute_technique_query(
    technique_id: str,
    window: str = "7d",
) -> TechniqueResult:
    tech = ATTACK_TECHNIQUES.get(technique_id)
    if not tech:
        return TechniqueResult(
            technique_id=technique_id,
            technique_name="Unknown",
            tactic="Unknown",
            evidence_level="not_found",
            event_count=0,
            kql_executed="",
            sample_findings=[],
        )

    kql = tech["query_template"].replace("{window}", window)

    # In Phase 0/1, we simulate execution — real SIEM execution in Phase 1+
    # Mock: generate plausible results based on technique
    import random
    random.seed(hash(technique_id + window))
    found = random.random() > 0.5
    count = random.randint(1, 47) if found else 0
    evidence = "suspected" if found and count < 10 else ("confirmed" if found else "not_found")

    sample = []
    if found:
        sample = [{"TimeGenerated": datetime.now(timezone.utc).isoformat(), "Result": f"Sample event for {tech['name']}", "Count": count}]

    return TechniqueResult(
        technique_id=technique_id,
        technique_name=tech["name"],
        tactic=tech["tactic"],
        evidence_level=evidence,
        event_count=count,
        kql_executed=kql,
        sample_findings=sample,
    )


async def run_hunt(
    query: str,
    time_window: str = "7d",
) -> HuntResult:
    start = datetime.now(timezone.utc)
    query_lower = query.lower()

    # Resolve threat actor or TTP keyword
    threat_actor = None
    techniques_to_hunt = list(ATTACK_TECHNIQUES.keys())  # default: all

    for actor, techniques in THREAT_ACTORS.items():
        if actor in query_lower:
            threat_actor = actor
            techniques_to_hunt = techniques
            break

    # Check for explicit technique IDs
    explicit = re.findall(r"T\d{4}(?:\.\d{3})?", query, re.IGNORECASE)
    if explicit:
        techniques_to_hunt = [t.upper() for t in explicit if t.upper() in ATTACK_TECHNIQUES]

    # Check for TTP keywords
    if "credential dump" in query_lower or "lsass" in query_lower:
        techniques_to_hunt = ["T1003", "T1078", "T1021"]
    elif "lateral movement" in query_lower:
        techniques_to_hunt = ["T1021", "T1078", "T1059"]
    elif "exfil" in query_lower:
        techniques_to_hunt = ["T1041", "T1003"]
    elif "persistence" in query_lower:
        techniques_to_hunt = ["T1136", "T1053", "T1078"]
    elif "ransomware" in query_lower:
        techniques_to_hunt = ["T1486", "T1059", "T1041", "T1003"]

    # Execute technique queries in parallel
    results = await asyncio.gather(*[_execute_technique_query(t, time_window) for t in techniques_to_hunt])

    with_evidence = [r for r in results if r.evidence_level != "not_found"]
    confirmed = [r for r in results if r.evidence_level == "confirmed"]

    # Generate narrative
    findings_summary = "\n".join(
        f"- {r.technique_id} ({r.technique_name}): {r.evidence_level} — {r.event_count} events"
        for r in results
    )
    narrative_prompt = (
        f"Hunt target: {query}\n"
        f"Time window: {time_window}\n"
        f"Threat actor: {threat_actor or 'not specified'}\n"
        f"Technique results:\n{findings_summary}"
    )

    narrative = await llm.complete(
        messages=[{"role": "user", "content": narrative_prompt}],
        system=_HUNT_NARRATIVE_SYSTEM,
        model=settings.nlq_model,
        max_tokens=600,
        use_cache=False,
    )

    end = datetime.now(timezone.utc)
    duration_ms = int((end - start).total_seconds() * 1000)

    return HuntResult(
        hunt_id=str(uuid.uuid4()),
        threat_actor=threat_actor,
        techniques_queried=len(techniques_to_hunt),
        techniques_with_evidence=len(with_evidence),
        technique_results=results,
        narrative=narrative,
        duration_ms=duration_ms,
        time_window=time_window,
    )
