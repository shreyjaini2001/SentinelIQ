"""
Connector & ingestion API (v1.3.0).

Deterministic mock endpoints for the connector foundation. Only the mock connector is
active; real platforms are placeholders that report `not_configured` and refuse to sync.
Ingestion runs are persisted via the v1.2 local demo store (namespace "ingestion").
No real credentials, no external API calls, no auth (local demo — see SECURITY.md).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, HTTPException

from src.schemas.connectors import ConnectorMeta, TestConnectionResult, IngestionRun, NormalizedEvent
from src.storage import local_store

router = APIRouter()

# Deterministic normalized sample events for the mock connector preview. Covers every
# category so the Data Sources preview clearly explains the abstraction (raw source →
# normalized category + common entity fields). Tied to the jsmith investigation.
_SAMPLE_EVENTS: list[dict[str, Any]] = [
    {
        "id": "EVT-AUTH-1", "timestamp": "2026-05-10T08:23:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Azure AD", "sourceType": "SIEM", "sourceTableOrIndex": "SigninLogs",
        "eventCategory": "authentication", "eventName": "Failed sign-in (impossible travel)",
        "severity": "high", "user": "jsmith@corp.com", "ip": "185.220.101.5", "country": "Russia",
        "ruleName": "ImpossibleTravelV2", "tactic": "Initial Access", "technique": "T1078",
        "linkedAlertIds": ["ALT-001"], "linkedInvestigationIds": ["INV-001"],
    },
    {
        "id": "EVT-PROC-1", "timestamp": "2026-05-10T06:12:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Microsoft Defender", "sourceType": "EDR", "sourceTableOrIndex": "DeviceProcessEvents",
        "eventCategory": "process", "eventName": "Encoded PowerShell execution", "severity": "high",
        "user": "jsmith", "host": "DESKTOP-42", "process": "powershell.exe",
        "commandLine": "-EncodedCommand aQBmACAoAC...", "tactic": "Execution", "technique": "T1059.001",
        "linkedInvestigationIds": ["INV-001"],
    },
    {
        "id": "EVT-NET-1", "timestamp": "2026-05-10T06:58:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Microsoft Defender", "sourceType": "EDR", "sourceTableOrIndex": "DeviceNetworkEvents",
        "eventCategory": "network", "eventName": "Outbound connection to suspicious IP", "severity": "high",
        "host": "SERVER-DC01", "ip": "185.220.101.5", "tactic": "Command and Control", "technique": "T1071.001",
        "linkedInvestigationIds": ["INV-001"],
    },
    {
        "id": "EVT-ID-1", "timestamp": "2026-05-10T00:00:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Azure AD", "sourceType": "IdP", "sourceTableOrIndex": "IdentityInfo",
        "eventCategory": "identity", "eventName": "Identity inventory record", "severity": "informational",
        "user": "jsmith@corp.com",
    },
    {
        "id": "EVT-NET-2", "timestamp": "2026-05-10T04:30:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Microsoft Defender", "sourceType": "EDR", "sourceTableOrIndex": "DeviceNetworkEvents",
        "eventCategory": "network", "eventName": "C2 beacon (non-standard port)", "severity": "medium",
        "host": "DESKTOP-42", "ip": "203.0.113.42", "tactic": "Command and Control", "technique": "T1571",
    },
    {
        "id": "EVT-CLOUD-1", "timestamp": "2026-05-10T04:15:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Azure AD", "sourceType": "SIEM", "sourceTableOrIndex": "AuditLogs",
        "eventCategory": "cloud", "eventName": "OAuth app consent granted", "severity": "medium",
        "user": "apps-team@corp.com", "tactic": "Persistence", "technique": "T1098.001",
    },
    {
        "id": "EVT-ALERT-1", "timestamp": "2026-05-10T08:15:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Microsoft Defender", "sourceType": "SIEM", "sourceTableOrIndex": "SecurityEvent",
        "eventCategory": "alert", "eventName": "Privileged Group Modification", "severity": "high",
        "user": "admin-svc", "ruleName": "PrivilegedGroupChange", "tactic": "Privilege Escalation",
        "technique": "T1078.002", "linkedAlertIds": ["ALT-002"], "linkedInvestigationIds": ["INV-001"],
    },
    {
        "id": "EVT-AUTH-2", "timestamp": "2026-05-10T05:55:00Z", "sourcePlatform": "mock",
        "sourceProduct": "Azure AD", "sourceType": "SIEM", "sourceTableOrIndex": "SigninLogs",
        "eventCategory": "authentication", "eventName": "Multiple Failed MFA Attempts", "severity": "medium",
        "user": "tbrown@corp.com", "ruleName": "MFASprayDetection", "tactic": "Credential Access",
        "technique": "T1110.003",
    },
]

_INGESTION_NS = "ingestion"
_INGESTION_KEY = "runs"
_MAX_RUNS = 50

# Deterministic connector registry — mirrors the frontend registry.
_MOCK_RECORDS = 196  # 190 mock alerts + sample events (deterministic)

_CONNECTORS: dict[str, dict[str, Any]] = {
    "mock-soc": {
        "id": "mock-soc",
        "name": "Mock SOC Dataset",
        "platform": "mock",
        "description": "Deterministic in-app SOC dataset (Microsoft Sentinel-style). Source of truth for the demo.",
        "status": "connected",
        "mode": "mock",
        "capabilities": ["authentication", "process", "network", "identity", "alerts", "query"],
        "recordsAvailable": _MOCK_RECORDS,
        "lastSync": None,
        "note": None,
    },
    **{
        spec["id"]: {
            **spec,
            "status": "not_configured",
            "mode": "real_placeholder",
            "capabilities": ["alerts", "query"],
            "recordsAvailable": 0,
            "lastSync": None,
            "note": "Planned — real credentials and API integration are future work. No data is fetched.",
        }
        for spec in [
            {"id": "sentinel", "name": "Microsoft Sentinel", "platform": "sentinel", "description": "Azure Log Analytics workspace via the Sentinel API."},
            {"id": "splunk", "name": "Splunk Enterprise", "platform": "splunk", "description": "Splunk Enterprise / Cloud via the REST API."},
            {"id": "elastic", "name": "Elastic Security", "platform": "elastic", "description": "Elasticsearch / Kibana SIEM via API key."},
            {"id": "defender", "name": "Microsoft Defender XDR", "platform": "defender", "description": "Endpoint + identity telemetry via the Defender API."},
            {"id": "crowdstrike", "name": "CrowdStrike Falcon", "platform": "crowdstrike", "description": "Endpoint detections + incidents via the Falcon API."},
            {"id": "okta", "name": "Okta", "platform": "okta", "description": "Identity + authentication events via the Okta System Log API."},
        ]
    },
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_mock(connector_id: str) -> bool:
    return connector_id == "mock-soc"


def _load_runs() -> list[dict[str, Any]]:
    doc = local_store.get_document(_INGESTION_NS, _INGESTION_KEY)
    runs = doc["payload"] if doc else []
    return runs if isinstance(runs, list) else []


def _save_runs(runs: list[dict[str, Any]]) -> None:
    local_store.put_document(_INGESTION_NS, _INGESTION_KEY, runs[:_MAX_RUNS])


@router.get("/connectors")
async def list_connectors():
    """All connectors (mock first). Deterministic — safe placeholders for real platforms."""
    connectors = [ConnectorMeta(**_CONNECTORS["mock-soc"]).model_dump()] + [
        ConnectorMeta(**c).model_dump() for cid, c in _CONNECTORS.items() if cid != "mock-soc"
    ]
    return {"connectors": connectors}


@router.get("/connectors/{connector_id}/sample-events")
async def sample_events(connector_id: str, limit: int = 12):
    """
    Deterministic normalized sample events for the connector preview. The mock connector
    returns real sample events; placeholders return an empty set with `not_configured`
    (no network, no credentials).
    """
    conn = _CONNECTORS.get(connector_id)
    if conn is None:
        raise HTTPException(status_code=404, detail=f"Unknown connector: {connector_id}")
    if not _is_mock(connector_id):
        return {"connectorId": connector_id, "status": "not_configured", "events": []}
    limit = max(1, min(limit, len(_SAMPLE_EVENTS)))
    events = [NormalizedEvent(**e).model_dump() for e in _SAMPLE_EVENTS[:limit]]
    return {"connectorId": connector_id, "status": "connected", "events": events}


@router.post("/connectors/{connector_id}/test")
async def test_connector(connector_id: str):
    conn = _CONNECTORS.get(connector_id)
    if conn is None:
        raise HTTPException(status_code=404, detail=f"Unknown connector: {connector_id}")
    if _is_mock(connector_id):
        result = TestConnectionResult(ok=True, status="connected", message="Mock connector reachable — deterministic dataset available.")
    else:
        result = TestConnectionResult(
            ok=False, status="not_configured",
            message=f"{conn['name']} is not configured. Real credentials and API integration are future work — no connection was attempted.",
        )
    return result.model_dump()


@router.post("/connectors/{connector_id}/sync")
async def sync_connector(connector_id: str, payload: dict[str, Any] = Body(default={})):
    """
    Create + persist an ingestion run. If the frontend posts a run it is stored as-is;
    otherwise a deterministic run is generated. Placeholders produce a failed (not_configured) run.
    """
    conn = _CONNECTORS.get(connector_id)
    if conn is None:
        raise HTTPException(status_code=404, detail=f"Unknown connector: {connector_id}")

    started = _now()
    if payload and payload.get("id"):
        run = IngestionRun(**payload)
    elif _is_mock(connector_id):
        run = IngestionRun(
            id=f"RUN-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            connectorId=connector_id, connectorName=conn["name"],
            startedAt=started, completedAt=_now(), status="success",
            recordsFetched=_MOCK_RECORDS, recordsNormalized=_MOCK_RECORDS,
            alertsCreated=190, errors=[], mode="mock",
        )
    else:
        run = IngestionRun(
            id=f"RUN-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            connectorId=connector_id, connectorName=conn["name"],
            startedAt=started, completedAt=_now(), status="failed",
            recordsFetched=0, recordsNormalized=0, alertsCreated=0,
            errors=["Connector not configured — real integration is future work."],
            mode="real_placeholder",
        )

    runs = _load_runs()
    runs.insert(0, run.model_dump())
    _save_runs(runs)
    if run.status == "success" and run.completedAt:
        local_store.set_metadata(f"connector_last_sync:{connector_id}", run.completedAt)
    return {"run": run.model_dump()}


@router.get("/ingestion-runs")
async def list_ingestion_runs():
    """Persisted ingestion-run history (newest first)."""
    return {"runs": _load_runs()}
