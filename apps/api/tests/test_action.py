"""
Tests for the SSE action endpoint.
The streaming response is consumed by reading the raw body as text/event-stream.
"""
import json
import pytest


def _parse_sse(text: str) -> list[dict]:
    """Parse SSE body into a list of event dicts."""
    events = []
    for block in text.strip().split("\n\n"):
        lines = block.strip().splitlines()
        event_type = "progress"
        data_str = ""
        for line in lines:
            if line.startswith("event: "):
                event_type = line[7:]
            elif line.startswith("data: "):
                data_str = line[6:]
        if data_str:
            try:
                payload = json.loads(data_str)
                events.append({"type": event_type, **payload})
            except json.JSONDecodeError:
                pass
    return events


@pytest.mark.asyncio
async def test_action_triage_streams_events(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "triage my open alerts",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    types = [e["type"] for e in events]
    assert "progress" in types
    assert "result" in types


@pytest.mark.asyncio
async def test_action_triage_result_has_data(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "triage alerts",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    result = result_events[0]
    assert result.get("handler") == "triage"
    assert "data" in result
    assert "verdicts" in result["data"]


@pytest.mark.asyncio
async def test_action_hunt_streams_events(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "hunt for lapsus$ TTPs",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0].get("handler") == "hunt"


@pytest.mark.asyncio
async def test_action_timeline_streams_result(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "show timeline for jsmith@corp.com",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0].get("handler") == "timeline"
    assert "data" in result_events[0]


@pytest.mark.asyncio
async def test_action_confirmed_handler(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "run it",
        "session_id": session_id,
        "confirmed_handler": "triage",
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert result_events[0].get("handler") == "triage"


@pytest.mark.asyncio
async def test_action_registry(client):
    resp = await client.get("/api/v1/action/registry")
    assert resp.status_code == 200
    handlers = resp.json()["handlers"]
    names = [h["name"] for h in handlers]
    assert "triage" in names
    assert "hunt" in names
    assert "timeline" in names
