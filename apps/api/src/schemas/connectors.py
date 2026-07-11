"""
Connector / ingestion schemas (v1.3.0).

Deterministic mock connector metadata + ingestion-run models. No real credentials, no real
API calls — real platforms are declared placeholders that report `not_configured`.
"""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class ConnectorMeta(BaseModel):
    id: str
    name: str
    platform: str
    description: str
    status: str           # connected | not_configured | error | disabled
    mode: str             # mock | dry_run | real_placeholder
    capabilities: list[str]
    recordsAvailable: int
    lastSync: Optional[str] = None
    note: Optional[str] = None


class TestConnectionResult(BaseModel):
    ok: bool
    status: str
    message: str


class IngestionRun(BaseModel):
    id: str
    connectorId: str
    connectorName: str
    startedAt: str
    completedAt: Optional[str] = None
    status: str           # pending | running | success | failed
    recordsFetched: int = 0
    recordsNormalized: int = 0
    alertsCreated: int = 0
    errors: list[str] = []
    mode: str = "mock"


class SyncRequest(BaseModel):
    """Optional run payload the frontend can post; if absent the backend generates one."""
    run: Optional[dict[str, Any]] = None


class NormalizedEvent(BaseModel):
    """Vendor-neutral normalized event (mirrors the frontend NormalizedSecurityEvent)."""
    id: str
    timestamp: str
    sourcePlatform: str
    sourceProduct: str
    sourceType: str
    sourceTableOrIndex: str
    eventCategory: str
    eventName: str
    severity: Optional[str] = None
    user: Optional[str] = None
    host: Optional[str] = None
    ip: Optional[str] = None
    process: Optional[str] = None
    commandLine: Optional[str] = None
    country: Optional[str] = None
    ruleName: Optional[str] = None
    tactic: Optional[str] = None
    technique: Optional[str] = None
    linkedAlertIds: list[str] = []
    linkedInvestigationIds: list[str] = []
