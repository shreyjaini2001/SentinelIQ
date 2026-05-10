"""
Capability 8 — Shift Handoff Briefing
PRD §7.1: Generates a structured incoming-analyst briefing at shift change.
"""
import uuid
from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel
from src.llm import client as llm
from src.providers import get_data_provider
from config import settings

_HANDOFF_SYSTEM = (
    "You are SentinelIQ's shift handoff AI. "
    "Write a 3-5 sentence key-context narrative for the incoming analyst. "
    "Summarize: what was investigated, what requires immediate attention, and what to watch. "
    "Be concise and actionable — no bullets, just dense prose. "
    "shift handoff briefing"
)


class HandoffItem(BaseModel):
    item_id: str
    title: str
    urgency: Literal["critical", "high", "medium", "low"]
    status: Literal["open", "closed", "in_progress"]
    entity_scope: str
    notes: str
    sla_deadline: str | None


class SLAIndicator(BaseModel):
    category: str
    target_minutes: int
    current_minutes: int
    status: Literal["on_track", "at_risk", "breached"]


class HandoffBriefingResult(BaseModel):
    briefing_id: str
    shift_window: str
    open_items: list[HandoffItem]
    closed_items: list[HandoffItem]
    key_context: str
    watch_list: list[str]
    recommended_next_actions: list[str]
    sla_indicators: list[SLAIndicator]
    duration_ms: int


_URGENCY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}

_STATUS_MAP = {"active": "open", "new": "open", "open": "open",
               "investigating": "in_progress", "in_progress": "in_progress",
               "closed": "closed", "resolved": "closed"}


def _norm_urgency(s: str) -> Literal["critical", "high", "medium", "low"]:
    return s.lower() if s.lower() in ("critical", "high", "medium", "low") else "medium"  # type: ignore[return-value]


def _norm_status(s: str) -> Literal["open", "closed", "in_progress"]:
    return _STATUS_MAP.get(s.lower(), "open")  # type: ignore[return-value]


async def generate_handoff(
    context_text: str = "",
    shift_window: str = "last 8 hours",
) -> HandoffBriefingResult:
    start = datetime.now(timezone.utc)
    dp = get_data_provider()

    alerts = dp.get_alerts(n=10)
    incidents = dp.get_incidents()
    past = dp.get_past_investigations()

    open_items: list[HandoffItem] = []
    closed_items: list[HandoffItem] = []

    # Incidents → items (highest signal)
    for inc in incidents:
        urgency = _norm_urgency(inc.get("severity", "high"))
        status = _norm_status(inc.get("status", "open"))
        entities = inc.get("entities", [])
        scope = ", ".join(str(e) for e in entities[:3]) or "Unknown"
        item = HandoffItem(
            item_id=inc.get("incident_id", str(uuid.uuid4())),
            title=inc.get("title", "Untitled Incident"),
            urgency=urgency,
            status=status,
            entity_scope=scope,
            notes=inc.get("summary", "Active incident requiring attention."),
            sla_deadline=None,
        )
        (closed_items if status == "closed" else open_items).append(item)

    # Alerts → open items (alerts have no explicit status; treat all as open)
    for alert in alerts:
        urgency = _norm_urgency(alert.get("severity", "medium"))
        item = HandoffItem(
            item_id=alert.get("alert_id", str(uuid.uuid4())),
            title=alert.get("title", "Untitled Alert"),
            urgency=urgency,
            status="open",
            entity_scope=str(alert.get("entity", "Unknown")),
            notes=f"Rule: {alert.get('rule_name', 'N/A')} — {alert.get('timestamp', '')}",
            sla_deadline=None,
        )
        open_items.append(item)

    open_items.sort(key=lambda x: _URGENCY_RANK.get(x.urgency, 4))

    # Watch list: top critical/high entities
    seen: set[str] = set()
    watch_list: list[str] = []
    for item in open_items:
        if item.urgency in ("critical", "high") and item.entity_scope not in seen:
            watch_list.append(f"{item.entity_scope} — {item.title}")
            seen.add(item.entity_scope)
        if len(watch_list) >= 5:
            break

    # Recommended actions
    top_open = open_items[0] if open_items else None
    recommended_next_actions: list[str] = []
    if top_open:
        recommended_next_actions.append(
            f"Escalate {top_open.item_id} ({top_open.title}) — {top_open.urgency.upper()} priority"
        )
    recommended_next_actions += [
        "Review LSASS memory access artifacts on DESKTOP-42",
        "Confirm all privileged account tokens for jsmith@corp.com have been revoked",
        "Check GeoAnomalyLogin rule queue — 47 alerts in 30 days, FP rate 12%",
    ]
    if past:
        p = past[0]
        recommended_next_actions.append(
            f"Apply lesson from {p.get('investigation_id', '')}: {p.get('lessons_learned', '')[:80]}"
        )

    sla_indicators = [
        SLAIndicator(category="Critical alert response", target_minutes=15, current_minutes=8, status="on_track"),
        SLAIndicator(category="High alert triage", target_minutes=60, current_minutes=52, status="on_track"),
        SLAIndicator(category="Incident escalation", target_minutes=30, current_minutes=31, status="at_risk"),
        SLAIndicator(category="Shift handoff completion", target_minutes=10, current_minutes=6, status="on_track"),
    ]

    llm_context = context_text or (
        f"Shift window: {shift_window}. "
        f"Open items: {len(open_items)} ({sum(1 for i in open_items if i.urgency == 'critical')} critical). "
        f"Closed this shift: {len(closed_items)}. "
        f"Watch entities: {', '.join(w.split(' — ')[0] for w in watch_list[:3])}."
    )

    key_context = await llm.complete(
        messages=[{"role": "user", "content": llm_context}],
        system=_HANDOFF_SYSTEM,
        model=settings.action_model,
        max_tokens=512,
        use_cache=True,
    )

    end = datetime.now(timezone.utc)

    return HandoffBriefingResult(
        briefing_id=str(uuid.uuid4()),
        shift_window=shift_window,
        open_items=open_items,
        closed_items=closed_items,
        key_context=key_context,
        watch_list=watch_list,
        recommended_next_actions=recommended_next_actions,
        sla_indicators=sla_indicators,
        duration_ms=int((end - start).total_seconds() * 1000),
    )
