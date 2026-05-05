import pytest


@pytest.mark.asyncio
async def test_query_returns_kql(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/query", json={
        "text": "Show me failed logins from unusual geolocations in the last 6 hours",
        "session_id": session_id,
        "mode": "query",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "generated_query" in data
    assert len(data["generated_query"]) > 10
    assert "query_id" in data
    assert 0 <= data["confidence"] <= 100


@pytest.mark.asyncio
async def test_query_explanation_has_clauses(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/query", json={
        "text": "Find PowerShell executions with encoded commands this week",
        "session_id": session_id,
        "mode": "query",
    })
    assert resp.status_code == 200
    data = resp.json()
    explanation = data.get("explanation", {})
    assert "summary" in explanation
    assert isinstance(explanation.get("clauses", []), list)


@pytest.mark.asyncio
async def test_query_refine_mode(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    # First query establishes context
    await client.post("/api/v1/query", json={
        "text": "Show me failed logins last 24 hours",
        "session_id": session_id,
        "mode": "query",
    })

    # Refine it
    resp = await client.post("/api/v1/query", json={
        "text": "Now filter to just accounts from the finance department",
        "session_id": session_id,
        "mode": "refine",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "generated_query" in data
    assert data.get("session_updated") is True


@pytest.mark.asyncio
async def test_query_kql_has_time_filter(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/query", json={
        "text": "Find lateral movement patterns in the last 3 days",
        "session_id": session_id,
        "mode": "query",
    })
    assert resp.status_code == 200
    kql = resp.json()["generated_query"]
    assert "TimeGenerated" in kql or "ago(" in kql


@pytest.mark.asyncio
async def test_query_missing_session_returns_error(client):
    resp = await client.post("/api/v1/query", json={
        "text": "Show me failed logins",
        "session_id": "",
        "mode": "query",
    })
    assert resp.status_code in (400, 422, 500)
