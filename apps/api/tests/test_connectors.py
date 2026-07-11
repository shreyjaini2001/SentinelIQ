"""
Connector & ingestion foundation tests (v1.3.0).
Deterministic mock endpoints — no real credentials, no external API calls.
"""
import pytest


@pytest.mark.asyncio
async def test_list_connectors(client):
    resp = await client.get("/api/v1/connectors")
    assert resp.status_code == 200
    connectors = resp.json()["connectors"]
    ids = [c["id"] for c in connectors]
    # Mock is first and connected; real platforms are placeholders.
    assert ids[0] == "mock-soc"
    assert connectors[0]["status"] == "connected"
    for c in connectors[1:]:
        assert c["status"] == "not_configured"
        assert c["mode"] == "real_placeholder"
    assert "sentinel" in ids and "splunk" in ids and "elastic" in ids


@pytest.mark.asyncio
async def test_sample_events_mock_returns_normalized(client):
    resp = await client.get("/api/v1/connectors/mock-soc/sample-events")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "connected"
    events = body["events"]
    assert len(events) > 0
    first = events[0]
    # Normalized fields present + covers multiple categories.
    for key in ("id", "timestamp", "sourcePlatform", "sourceTableOrIndex", "eventCategory", "eventName"):
        assert key in first
    categories = {e["eventCategory"] for e in events}
    assert {"authentication", "process", "network"} & categories


@pytest.mark.asyncio
async def test_sample_events_limit(client):
    resp = await client.get("/api/v1/connectors/mock-soc/sample-events?limit=3")
    assert resp.status_code == 200
    assert len(resp.json()["events"]) == 3


@pytest.mark.asyncio
async def test_sample_events_placeholder_empty(client):
    resp = await client.get("/api/v1/connectors/sentinel/sample-events")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "not_configured"
    assert body["events"] == []


@pytest.mark.asyncio
async def test_sample_events_unknown_404(client):
    resp = await client.get("/api/v1/connectors/nope/sample-events")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_test_connection_mock_passes(client):
    resp = await client.post("/api/v1/connectors/mock-soc/test")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["status"] == "connected"


@pytest.mark.asyncio
async def test_test_connection_placeholder_not_configured(client):
    resp = await client.post("/api/v1/connectors/sentinel/test")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is False
    assert body["status"] == "not_configured"


@pytest.mark.asyncio
async def test_test_connection_unknown_404(client):
    resp = await client.post("/api/v1/connectors/does-not-exist/test")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_mock_sync_creates_ingestion_run(client):
    resp = await client.post("/api/v1/connectors/mock-soc/sync")
    assert resp.status_code == 200
    run = resp.json()["run"]
    assert run["status"] == "success"
    assert run["connectorId"] == "mock-soc"
    assert run["recordsNormalized"] > 0
    assert run["mode"] == "mock"

    # It is now persisted and returned by the history endpoint.
    hist = await client.get("/api/v1/ingestion-runs")
    assert hist.status_code == 200
    runs = hist.json()["runs"]
    assert any(r["id"] == run["id"] for r in runs)


@pytest.mark.asyncio
async def test_sync_accepts_posted_run(client):
    posted = {
        "id": "RUN-test-1",
        "connectorId": "mock-soc",
        "connectorName": "Mock SOC Dataset",
        "startedAt": "2026-05-10T00:00:00Z",
        "completedAt": "2026-05-10T00:00:01Z",
        "status": "success",
        "recordsFetched": 5,
        "recordsNormalized": 5,
        "alertsCreated": 2,
        "errors": [],
        "mode": "mock",
    }
    resp = await client.post("/api/v1/connectors/mock-soc/sync", json=posted)
    assert resp.status_code == 200
    assert resp.json()["run"]["id"] == "RUN-test-1"


@pytest.mark.asyncio
async def test_placeholder_sync_is_failed_run(client):
    resp = await client.post("/api/v1/connectors/splunk/sync")
    assert resp.status_code == 200
    run = resp.json()["run"]
    assert run["status"] == "failed"
    assert run["mode"] == "real_placeholder"
    assert run["errors"]
