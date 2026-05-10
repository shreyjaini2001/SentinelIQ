"""Tests for Capability 8 — Shift Handoff Briefing."""
import json
import pytest
from src.capabilities.handoff import generate_handoff, HandoffBriefingResult


# ── Unit tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_handoff_returns_result():
    result = await generate_handoff()
    assert isinstance(result, HandoffBriefingResult)
    assert result.briefing_id
    assert result.shift_window


@pytest.mark.asyncio
async def test_handoff_has_open_items():
    result = await generate_handoff()
    assert len(result.open_items) > 0


@pytest.mark.asyncio
async def test_handoff_open_items_sorted_by_urgency():
    result = await generate_handoff()
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    scores = [rank[item.urgency] for item in result.open_items]
    assert scores == sorted(scores)


@pytest.mark.asyncio
async def test_handoff_has_key_context():
    result = await generate_handoff()
    assert len(result.key_context) > 20


@pytest.mark.asyncio
async def test_handoff_has_watch_list():
    result = await generate_handoff()
    assert isinstance(result.watch_list, list)


@pytest.mark.asyncio
async def test_handoff_has_recommended_actions():
    result = await generate_handoff()
    assert len(result.recommended_next_actions) > 0


@pytest.mark.asyncio
async def test_handoff_sla_indicators():
    result = await generate_handoff()
    assert len(result.sla_indicators) > 0
    for sla in result.sla_indicators:
        assert sla.status in ("on_track", "at_risk", "breached")
        assert sla.target_minutes > 0


@pytest.mark.asyncio
async def test_handoff_model_fields():
    result = await generate_handoff()
    d = result.model_dump()
    required = {"briefing_id", "shift_window", "open_items", "closed_items",
                "key_context", "watch_list", "recommended_next_actions",
                "sla_indicators", "duration_ms"}
    assert required.issubset(d.keys())


@pytest.mark.asyncio
async def test_handoff_item_fields():
    result = await generate_handoff()
    for item in result.open_items[:3]:
        assert item.item_id
        assert item.title
        assert item.urgency in ("critical", "high", "medium", "low")
        assert item.status in ("open", "closed", "in_progress")


@pytest.mark.asyncio
async def test_handoff_custom_shift_window():
    result = await generate_handoff(shift_window="last 12 hours")
    assert result.shift_window == "last 12 hours"


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_handoff_api_default(client):
    resp = await client.post("/api/v1/handoff", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert "briefing_id" in data
    assert "open_items" in data
    assert "key_context" in data


@pytest.mark.asyncio
async def test_handoff_api_custom_window(client):
    resp = await client.post("/api/v1/handoff", json={"shift_window": "last 4 hours"})
    assert resp.status_code == 200
    assert resp.json()["shift_window"] == "last 4 hours"


@pytest.mark.asyncio
async def test_handoff_action_endpoint_streams_result(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Write my handoff summary",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0]["handler"] == "handoff"
    assert "open_items" in result_events[0]["data"]


@pytest.mark.asyncio
async def test_handoff_next_shift_routing(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Brief the next shift on what happened today",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert result_events[0]["handler"] == "handoff"


def _parse_sse(text: str) -> list[dict]:
    events = []
    for block in text.strip().split("\n\n"):
        lines = block.strip().splitlines()
        event_type, data_str = "progress", ""
        for line in lines:
            if line.startswith("event: "):
                event_type = line[7:]
            elif line.startswith("data: "):
                data_str = line[6:]
        if data_str:
            try:
                events.append({"type": event_type, **json.loads(data_str)})
            except json.JSONDecodeError:
                pass
    return events
