"""
Local demo persistence API (v1.2.0).

Document-style hydration/save endpoints backing the frontend's serialized domain state.
No auth (local demo only — see SECURITY.md). Payloads are opaque JSON documents; the backend
does not interpret investigation/alert internals, keeping a clean boundary for a future real DB.
"""
from typing import Any, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel

from config import settings
from src.storage import local_store

router = APIRouter()


class StateSnapshot(BaseModel):
    """Frontend snapshot. Every domain field is optional so partial saves are safe."""
    schemaVersion: Optional[int] = None
    generatedAt: Optional[str] = None
    investigations: Optional[Any] = None
    alerts: Optional[Any] = None
    workspaceMemory: Optional[Any] = None
    logsMemory: Optional[Any] = None
    savedQueries: Optional[Any] = None
    recentQueries: Optional[Any] = None
    userPreferences: Optional[Any] = None
    demoMetadata: Optional[Any] = None


# Snapshot field  ->  (namespace, key). One document per domain section.
FIELD_MAP: list[tuple[str, str, str]] = [
    ("investigations", "investigations", "default"),
    ("alerts", "alerts", "default"),
    ("workspaceMemory", "workspace", "default"),
    ("logsMemory", "logs", "memory"),
    ("savedQueries", "logs", "saved_queries"),
    ("recentQueries", "logs", "recent_queries"),
    ("userPreferences", "user_preferences", "default"),
    ("demoMetadata", "demo_metadata", "default"),
]


@router.get("/persistence/health")
async def persistence_health():
    s = local_store.stats()
    return {
        "status": "ok",
        "storageMode": "local-sqlite",
        "mockMode": settings.mock_llm,
        "lastSaved": local_store.get_metadata("last_saved"),
        **s,
    }


@router.get("/persistence/state")
async def get_state():
    """Return the full persisted snapshot for frontend hydration (nulls where absent)."""
    out: dict[str, Any] = {"schemaVersion": local_store.SCHEMA_VERSION, "generatedAt": local_store._now()}
    has_any = False
    for field, ns, key in FIELD_MAP:
        doc = local_store.get_document(ns, key)
        out[field] = doc["payload"] if doc else None
        if doc is not None:
            has_any = True
    out["hasPersistedState"] = has_any
    return out


@router.put("/persistence/state")
async def put_state(snapshot: StateSnapshot):
    """Upsert each provided domain section. Missing/None fields are left untouched."""
    data = snapshot.model_dump()
    saved = 0
    for field, ns, key in FIELD_MAP:
        value = data.get(field)
        if value is not None:
            local_store.put_document(ns, key, value)
            saved += 1
    now = local_store._now()
    local_store.set_metadata("last_saved", now)
    return {"status": "ok", "savedAt": now, "sectionsSaved": saved, **local_store.stats()}


@router.post("/persistence/reset")
async def reset_state():
    """Clear all local demo persistence. The frontend then reseeds to default mock state."""
    local_store.clear_all()
    return {"status": "ok", "message": "Local demo persistence cleared.", **local_store.stats()}


# --- Optional per-document access (small, safe) ---

@router.get("/persistence/document/{namespace}/{key}")
async def get_document(namespace: str, key: str):
    doc = local_store.get_document(namespace, key)
    if doc is None:
        return {"namespace": namespace, "key": key, "payload": None, "found": False}
    return {"namespace": namespace, "key": key, "found": True, **doc}


@router.put("/persistence/document/{namespace}/{key}")
async def put_document(namespace: str, key: str, payload: Any = Body(...)):
    local_store.put_document(namespace, key, payload)
    return {"status": "ok", "namespace": namespace, "key": key}
