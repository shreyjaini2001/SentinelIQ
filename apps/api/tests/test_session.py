import pytest


@pytest.mark.asyncio
async def test_create_session(client):
    resp = await client.post("/api/v1/session?analyst_id=test_analyst")
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert len(data["session_id"]) > 8
    assert "expires_at" in data


@pytest.mark.asyncio
async def test_get_session(client):
    create = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = create.json()["session_id"]

    resp = await client.get(f"/api/v1/session/{session_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == session_id


@pytest.mark.asyncio
async def test_session_persists_query_history(client):
    create = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = create.json()["session_id"]

    await client.post("/api/v1/query", json={
        "text": "Show me failed logins last 24 hours",
        "session_id": session_id,
        "mode": "query",
    })

    resp = await client.get(f"/api/v1/session/{session_id}")
    data = resp.json()
    assert data["turn_count"] >= 1


@pytest.mark.asyncio
async def test_session_share_token(client):
    create = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = create.json()["session_id"]

    resp = await client.post(f"/api/v1/session/{session_id}/share")
    assert resp.status_code == 200
    data = resp.json()
    assert "share_token" in data
    assert len(data["share_token"]) >= 8


@pytest.mark.asyncio
async def test_session_not_found_returns_404(client):
    resp = await client.get("/api/v1/session/nonexistent-session-id-12345")
    assert resp.status_code == 404
