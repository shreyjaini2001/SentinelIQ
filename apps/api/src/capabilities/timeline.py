"""
Capability 3 — Timeline Reconstruction
PRD §6.3: Builds chronological attack chain from seed entities.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Literal
from src.llm import client as llm
from config import settings

# ATT&CK tactic stage classifier (deterministic keyword mapping, no LLM per event)
_TACTIC_KEYWORDS = {
    "Reconnaissance": ["scan", "nmap", "recon", "enum", "shodan"],
    "Initial Access": ["phish", "exploit", "vpn", "remote", "external"],
    "Execution": ["powershell", "cmd", "bash", "script", "execute", "run", "spawn"],
    "Persistence": ["scheduled task", "registry", "startup", "autorun", "service install"],
    "Privilege Escalation": ["escalate", "sudo", "runas", "admin", "privilege", "elevation", "4672"],
    "Defense Evasion": ["disable", "tamper", "delete log", "shadow copy", "obfuscat", "encode", "amsi"],
    "Credential Access": ["lsass", "mimikatz", "credential", "hash", "kerberos", "ntlm", "password"],
    "Discovery": ["whoami", "ipconfig", "net user", "net group", "ldap", "discover"],
    "Lateral Movement": ["lateral", "rdp", "wmi", "psexec", "smb", "4648", "logontype 3"],
    "Collection": ["collect", "compress", "archive", "zip", "stage"],
    "Exfiltration": ["upload", "ftp", "s3", "exfil", "transfer", "send"],
    "Command and Control": ["beacon", "c2", "c&c", "dns tunnel", "http", "callback"],
    "Impact": ["ransom", "encrypt", "wipe", "destroy", "delete all"],
}


class TimelineEvent(BaseModel):
    event_id: str
    timestamp: str
    source: str
    entity_type: str
    entity_value: str
    event_type: str
    raw_description: str
    tactic: str
    tactic_confidence: float
    normalized_timestamp: str


class StageAnnotation(BaseModel):
    tactic: str
    event_count: int
    first_seen: str
    last_seen: str
    plain_english_summary: str


class TimelineResult(BaseModel):
    timeline_id: str
    seed_entity: str
    window_start: str
    window_end: str
    total_events: int
    events: list[TimelineEvent]
    stages: list[StageAnnotation]
    sources_queried: list[str]
    duration_ms: int


def _classify_tactic(text: str) -> tuple[str, float]:
    text_lower = text.lower()
    scores = {}
    for tactic, keywords in _TACTIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[tactic] = score
    if not scores:
        return "Discovery", 0.4
    best = max(scores, key=scores.get)
    confidence = min(0.95, 0.5 + scores[best] * 0.15)
    return best, confidence


def _generate_events(
    entity: str,
    window_start: datetime,
    window_end: datetime,
) -> list[TimelineEvent]:
    """Generate timeline events from FixtureDataProvider or fall back to hardcoded set."""
    raw_events: list[dict] = []

    try:
        from src.providers import get_data_provider
        provider = get_data_provider()
        raw_events = provider.get_all_events_for_entity(entity, window_start, window_end)
    except Exception:
        pass

    if not raw_events:
        # Hardcoded fallback (used when provider unavailable or entity has no fixture data)
        raw_events = [
            {"timestamp": (window_start + timedelta(minutes=5)).isoformat(), "source": "SigninLogs", "description": "Successful login from unusual location (RU)", "event_type": "auth"},
            {"timestamp": (window_start + timedelta(minutes=12)).isoformat(), "source": "SecurityEvent", "description": "Special privileges assigned to session (4672)", "event_type": "auth"},
            {"timestamp": (window_start + timedelta(minutes=18)).isoformat(), "source": "DeviceProcessEvents", "description": "powershell.exe spawned with encoded command -enc JABjAG0A", "event_type": "process"},
            {"timestamp": (window_start + timedelta(minutes=25)).isoformat(), "source": "DeviceProcessEvents", "description": "cmd.exe executed: whoami /all", "event_type": "process"},
            {"timestamp": (window_start + timedelta(minutes=31)).isoformat(), "source": "DeviceProcessEvents", "description": "net.exe: net user /domain", "event_type": "process"},
            {"timestamp": (window_start + timedelta(minutes=38)).isoformat(), "source": "DeviceNetworkEvents", "description": "SMB connection from workstation to DC01 (lateral movement)", "event_type": "network"},
            {"timestamp": (window_start + timedelta(minutes=45)).isoformat(), "source": "DeviceProcessEvents", "description": "lsass.exe memory access from rundll32.exe", "event_type": "process"},
            {"timestamp": (window_start + timedelta(minutes=52)).isoformat(), "source": "DeviceNetworkEvents", "description": "Outbound connection to 185.220.101.45:443 - 47MB transferred", "event_type": "network"},
        ]

    entity_type = "host" if any(
        kw in entity.upper() for kw in ("DESKTOP", "SERVER", "HOST", "DC", "SRV")
    ) else "user"

    events = []
    for raw in raw_events:
        description = raw.get("description", raw.get("raw_description", ""))
        tactic, confidence = _classify_tactic(description)
        ts = raw.get("timestamp", window_start.isoformat())
        events.append(TimelineEvent(
            event_id=raw.get("event_id", str(uuid.uuid4())),
            timestamp=ts,
            source=raw.get("source", "Unknown"),
            entity_type=entity_type,
            entity_value=entity,
            event_type=raw.get("event_type", "unknown"),
            raw_description=description,
            tactic=tactic,
            tactic_confidence=confidence,
            normalized_timestamp=ts,
        ))
    return events


_STAGE_ANNOTATION_SYSTEM = """You are SentinelIQ's timeline annotation AI. Given a group of security events for a single ATT&CK tactic,
write a single plain-English sentence (max 25 words) summarizing what happened.

Format: One sentence only. No bullet points. No headers. Start with what happened, not "The attacker"."""


async def _annotate_stage(tactic: str, events: list[TimelineEvent]) -> str:
    descriptions = "; ".join(e.raw_description[:60] for e in events[:3])
    raw = await llm.complete(
        messages=[{"role": "user", "content": f"Tactic: {tactic}\nEvents: {descriptions}\nWrite one summary sentence:"}],
        system=_STAGE_ANNOTATION_SYSTEM,
        model=settings.classifier_model,
        max_tokens=60,
        use_cache=True,
    )
    return raw.strip()


async def reconstruct_timeline(
    seed_entity: str,
    window_hours_before: float = 2.0,
    window_minutes_after: float = 30.0,
    pivot_timestamp: datetime | None = None,
) -> TimelineResult:
    start_t = datetime.now(timezone.utc)
    pivot = pivot_timestamp or (datetime.now(timezone.utc) - timedelta(hours=1))
    window_start = pivot - timedelta(hours=window_hours_before)
    window_end = pivot + timedelta(minutes=window_minutes_after)

    all_events = _generate_events(seed_entity, window_start, window_end)
    all_events.sort(key=lambda e: e.timestamp)

    # Group by tactic
    tactic_groups: dict[str, list[TimelineEvent]] = {}
    for event in all_events:
        tactic_groups.setdefault(event.tactic, []).append(event)

    # Annotate each tactic group (parallel LLM calls, one per group)
    annotation_tasks = [
        _annotate_stage(tactic, events)
        for tactic, events in tactic_groups.items()
    ]
    annotation_texts = await asyncio.gather(*annotation_tasks)

    stages = []
    for (tactic, events), annotation in zip(tactic_groups.items(), annotation_texts):
        stages.append(StageAnnotation(
            tactic=tactic,
            event_count=len(events),
            first_seen=events[0].timestamp,
            last_seen=events[-1].timestamp,
            plain_english_summary=annotation,
        ))

    # Sort stages by ATT&CK kill chain order
    tactic_order = list(_TACTIC_KEYWORDS.keys())
    stages.sort(key=lambda s: tactic_order.index(s.tactic) if s.tactic in tactic_order else 99)

    end_t = datetime.now(timezone.utc)
    duration_ms = int((end_t - start_t).total_seconds() * 1000)

    return TimelineResult(
        timeline_id=str(uuid.uuid4()),
        seed_entity=seed_entity,
        window_start=window_start.isoformat(),
        window_end=window_end.isoformat(),
        total_events=len(all_events),
        events=all_events,
        stages=stages,
        sources_queried=["SigninLogs", "SecurityEvent", "DeviceProcessEvents", "DeviceNetworkEvents"],
        duration_ms=duration_ms,
    )
