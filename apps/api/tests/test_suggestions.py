import pytest


@pytest.mark.asyncio
async def test_suggestions_default_chips_on_empty_session(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.get("/api/v1/suggestions", params={"session_id": session_id})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["chips"], list)
    assert len(data["chips"]) > 0


@pytest.mark.asyncio
async def test_suggestions_chips_have_required_fields(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.get("/api/v1/suggestions", params={"session_id": session_id})
    for chip in resp.json()["chips"]:
        assert "id" in chip
        assert "label" in chip
        assert chip["type"] in ("query", "action")
        assert "prompt_text" in chip


@pytest.mark.asyncio
async def test_suggestions_after_query(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    await client.post("/api/v1/query", json={
        "text": "Show me failed logins in the last 6 hours",
        "session_id": session_id,
        "mode": "query",
    })

    resp = await client.get("/api/v1/suggestions", params={"session_id": session_id})
    assert resp.status_code == 200
    assert len(resp.json()["chips"]) > 0
