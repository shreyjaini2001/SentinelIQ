import pytest


@pytest.mark.asyncio
async def test_hunt_general(client):
    resp = await client.post("/api/v1/hunt", json={"query": "general threat hunt", "time_window": "7d"})
    assert resp.status_code == 200
    data = resp.json()
    assert "hunt_id" in data
    assert data["techniques_queried"] > 0
    assert isinstance(data["technique_results"], list)
    assert len(data["narrative"]) > 20


@pytest.mark.asyncio
async def test_hunt_threat_actor(client):
    resp = await client.post("/api/v1/hunt", json={"query": "hunt for lapsus$ TTPs", "time_window": "7d"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["threat_actor"] is not None
    assert "lapsus" in data["threat_actor"].lower()


@pytest.mark.asyncio
async def test_hunt_technique_results_structure(client):
    resp = await client.post("/api/v1/hunt", json={"query": "credential dumping hunt", "time_window": "24h"})
    assert resp.status_code == 200
    for tr in resp.json()["technique_results"]:
        assert "technique_id" in tr
        assert tr["technique_id"].startswith("T")
        assert "technique_name" in tr
        assert "tactic" in tr
        assert tr["evidence_level"] in ("confirmed", "suspected", "not_found")
        assert tr["event_count"] >= 0
        assert "kql_executed" in tr


@pytest.mark.asyncio
async def test_hunt_evidence_counts_consistent(client):
    resp = await client.post("/api/v1/hunt", json={"query": "lateral movement hunt"})
    data = resp.json()
    with_evidence = sum(
        1 for tr in data["technique_results"]
        if tr["evidence_level"] != "not_found"
    )
    assert with_evidence == data["techniques_with_evidence"]


@pytest.mark.asyncio
async def test_list_techniques(client):
    resp = await client.get("/api/v1/hunt/techniques")
    assert resp.status_code == 200
    data = resp.json()
    assert "techniques" in data
    assert len(data["techniques"]) >= 10
    assert "threat_actors" in data
    for tid, info in data["techniques"].items():
        assert tid.startswith("T")
        assert "name" in info
        assert "tactic" in info
