import pytest


@pytest.mark.asyncio
async def test_autocomplete_empty_for_short_prefix(client):
    resp = await client.get("/api/v1/autocomplete", params={"q": "hi"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["completions"] == []


@pytest.mark.asyncio
async def test_autocomplete_returns_list(client):
    resp = await client.get("/api/v1/autocomplete", params={"q": "show me failed"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["completions"], list)


@pytest.mark.asyncio
async def test_autocomplete_completions_have_required_fields(client):
    resp = await client.get("/api/v1/autocomplete", params={"q": "failed login"})
    assert resp.status_code == 200
    for item in resp.json()["completions"]:
        assert "text" in item
        assert "source" in item
        assert item["source"] in ("history", "template", "team_pool")
        assert "recency_score" in item
        assert 0.0 <= item["recency_score"] <= 1.0


@pytest.mark.asyncio
async def test_autocomplete_does_not_crash_on_unicode(client):
    resp = await client.get("/api/v1/autocomplete", params={"q": "show 日本語"})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_autocomplete_with_session_id(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.get("/api/v1/autocomplete", params={
        "q": "find lateral",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    assert isinstance(resp.json()["completions"], list)
