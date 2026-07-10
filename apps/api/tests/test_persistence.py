"""
Tests for the v1.2.0 local demo persistence API.
Runs in-process with an in-memory SQLite store (see conftest SENTINELIQ_DB_PATH).
"""
import pytest


@pytest.mark.asyncio
async def test_persistence_health(client):
    resp = await client.get("/api/v1/persistence/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["storageMode"] == "local-sqlite"
    assert body["schemaVersion"] == 1
    assert "dbPath" in body


@pytest.mark.asyncio
async def test_state_roundtrip(client):
    # Reset first so this test is independent of ordering.
    await client.post("/api/v1/persistence/reset")

    snapshot = {
        "schemaVersion": 1,
        "generatedAt": "2026-07-10T00:00:00Z",
        "investigations": [{"id": "INV-TEST", "title": "Persist me"}],
        "alerts": [{"id": "ALT-TEST", "status": "investigating"}],
        "workspaceMemory": {"INV-TEST": {"workspaceId": "INV-TEST", "lastPage": "logs"}},
        "savedQueries": ["SigninLogs | take 5"],
        "recentQueries": ["DeviceProcessEvents | take 5"],
        "userPreferences": {"theme": "dark"},
        "demoMetadata": {"appVersion": "v1.2.0"},
    }
    put = await client.put("/api/v1/persistence/state", json=snapshot)
    assert put.status_code == 200
    assert put.json()["status"] == "ok"
    assert put.json()["sectionsSaved"] >= 7

    got = await client.get("/api/v1/persistence/state")
    assert got.status_code == 200
    state = got.json()
    assert state["hasPersistedState"] is True
    assert state["investigations"] == [{"id": "INV-TEST", "title": "Persist me"}]
    assert state["alerts"][0]["status"] == "investigating"
    assert state["workspaceMemory"]["INV-TEST"]["lastPage"] == "logs"
    assert state["savedQueries"] == ["SigninLogs | take 5"]
    assert state["demoMetadata"]["appVersion"] == "v1.2.0"


@pytest.mark.asyncio
async def test_partial_save_leaves_other_sections(client):
    await client.post("/api/v1/persistence/reset")
    await client.put("/api/v1/persistence/state", json={"savedQueries": ["q1"]})
    # A later partial save that omits savedQueries must not wipe it.
    await client.put("/api/v1/persistence/state", json={"recentQueries": ["r1"]})
    state = (await client.get("/api/v1/persistence/state")).json()
    assert state["savedQueries"] == ["q1"]
    assert state["recentQueries"] == ["r1"]


@pytest.mark.asyncio
async def test_reset_clears_state(client):
    await client.put("/api/v1/persistence/state", json={"investigations": [{"id": "X"}]})
    reset = await client.post("/api/v1/persistence/reset")
    assert reset.status_code == 200
    state = (await client.get("/api/v1/persistence/state")).json()
    assert state["hasPersistedState"] is False
    assert state["investigations"] is None


@pytest.mark.asyncio
async def test_document_endpoints(client):
    await client.post("/api/v1/persistence/reset")
    put = await client.put("/api/v1/persistence/document/user_preferences/default", json={"k": "v"})
    assert put.status_code == 200
    got = await client.get("/api/v1/persistence/document/user_preferences/default")
    assert got.json()["found"] is True
    assert got.json()["payload"] == {"k": "v"}

    missing = await client.get("/api/v1/persistence/document/nope/nope")
    assert missing.json()["found"] is False
