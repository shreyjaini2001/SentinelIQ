import pytest


@pytest.mark.asyncio
async def test_timeline_returns_result(client):
    resp = await client.post("/api/v1/timeline", json={"seed_entity": "jsmith@corp.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert "timeline_id" in data
    assert data["seed_entity"] == "jsmith@corp.com"
    assert data["total_events"] > 0


@pytest.mark.asyncio
async def test_timeline_stages_structure(client):
    resp = await client.post("/api/v1/timeline", json={"seed_entity": "jsmith@corp.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["stages"], list)
    assert len(data["stages"]) > 0
    for stage in data["stages"]:
        assert "tactic" in stage
        assert "event_count" in stage
        assert stage["event_count"] > 0
        assert "plain_english_summary" in stage
        assert len(stage["plain_english_summary"]) > 5


@pytest.mark.asyncio
async def test_timeline_events_structure(client):
    resp = await client.post("/api/v1/timeline", json={"seed_entity": "DESKTOP-42"})
    assert resp.status_code == 200
    for event in resp.json()["events"]:
        assert "event_id" in event
        assert "timestamp" in event
        assert "source" in event
        assert "tactic" in event
        assert 0.0 <= event["tactic_confidence"] <= 1.0


@pytest.mark.asyncio
async def test_timeline_window_parameters(client):
    resp = await client.post("/api/v1/timeline", json={
        "seed_entity": "jsmith@corp.com",
        "window_hours_before": 4.0,
        "window_minutes_after": 60.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "window_start" in data
    assert "window_end" in data


@pytest.mark.asyncio
async def test_timeline_sources_queried(client):
    resp = await client.post("/api/v1/timeline", json={"seed_entity": "jsmith@corp.com"})
    data = resp.json()
    assert isinstance(data["sources_queried"], list)
    assert len(data["sources_queried"]) > 0


@pytest.mark.asyncio
async def test_timeline_host_entity(client):
    resp = await client.post("/api/v1/timeline", json={"seed_entity": "SERVER-DC01"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_events"] > 0
