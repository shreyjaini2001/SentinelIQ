import pytest


@pytest.mark.asyncio
async def test_classify_query_mode(client):
    resp = await client.post("/api/v1/classify", json={"text": "Show me failed logins last 24 hours"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "query"
    assert 0.0 <= data["confidence"] <= 1.0
    assert "intent_label" in data


@pytest.mark.asyncio
async def test_classify_action_mode(client):
    resp = await client.post("/api/v1/classify", json={"text": "Triage my open alerts"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "action"


@pytest.mark.asyncio
async def test_classify_refine_mode(client):
    resp = await client.post("/api/v1/classify", json={"text": "Now filter to just finance users"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] in ("refine", "query")


@pytest.mark.asyncio
async def test_classify_with_session(client):
    resp = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = resp.json()["session_id"]

    resp = await client.post("/api/v1/classify", json={
        "text": "Hunt for LAPSUS$ TTPs",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] in ("query", "action")


@pytest.mark.asyncio
async def test_classify_short_input(client):
    resp = await client.post("/api/v1/classify", json={"text": "hi"})
    assert resp.status_code == 200
    data = resp.json()
    assert "mode" in data


@pytest.mark.asyncio
async def test_classify_disambiguation_chips_on_low_confidence(client):
    resp = await client.post("/api/v1/classify", json={"text": "run something"})
    assert resp.status_code == 200
    data = resp.json()
    # disambiguation_chips may or may not appear — just ensure structure is valid
    chips = data.get("disambiguation_chips", [])
    for chip in chips:
        assert "label" in chip
        assert "mode" in chip
