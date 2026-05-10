"""Tests for Capability 9 — Runbook Generation."""
import json
import pytest
from src.capabilities.runbook import generate_runbook, RunbookResult


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


# ── Unit tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_runbook_returns_result():
    result = await generate_runbook("Generate a runbook for privilege escalation alerts")
    assert isinstance(result, RunbookResult)
    assert result.runbook_id


@pytest.mark.asyncio
async def test_runbook_privilege_escalation_scenario():
    result = await generate_runbook("runbook for privilege escalation", scenario_hint="privilege escalation")
    assert result.scenario == "Privilege Escalation"
    assert len(result.steps) >= 4


@pytest.mark.asyncio
async def test_runbook_credential_dumping_scenario():
    result = await generate_runbook("Create a runbook for LSASS credential dumping")
    assert "credential" in result.scenario.lower() or "Credential" in result.title


@pytest.mark.asyncio
async def test_runbook_steps_have_required_fields():
    result = await generate_runbook("runbook for lateral movement")
    for step in result.steps:
        assert step.step_number > 0
        assert step.action
        assert step.role_owner
        assert step.estimated_minutes > 0
        assert isinstance(step.tools_commands, list)


@pytest.mark.asyncio
async def test_runbook_steps_are_sequential():
    result = await generate_runbook("runbook for phishing")
    step_numbers = [s.step_number for s in result.steps]
    assert step_numbers == list(range(1, len(result.steps) + 1))


@pytest.mark.asyncio
async def test_runbook_has_related_techniques():
    result = await generate_runbook("runbook for privilege escalation")
    assert len(result.related_techniques) > 0
    # Techniques should include ATT&CK IDs
    assert any("T" in t for t in result.related_techniques)


@pytest.mark.asyncio
async def test_runbook_has_similar_incidents():
    result = await generate_runbook("runbook for phishing campaign")
    assert isinstance(result.similar_incidents, list)


@pytest.mark.asyncio
async def test_runbook_estimated_total_minutes():
    result = await generate_runbook("runbook for account compromise")
    assert result.estimated_total_minutes > 0
    assert result.estimated_total_minutes == sum(s.estimated_minutes for s in result.steps)


@pytest.mark.asyncio
async def test_runbook_has_narrative():
    result = await generate_runbook("Create a runbook for ransomware response")
    assert len(result.narrative) > 20


@pytest.mark.asyncio
async def test_runbook_model_fields():
    result = await generate_runbook("runbook for malicious powershell execution")
    d = result.model_dump()
    required = {"runbook_id", "title", "alert_type", "scenario", "steps",
                "related_techniques", "similar_incidents", "estimated_total_minutes",
                "narrative", "duration_ms"}
    assert required.issubset(d.keys())


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_runbook_api(client):
    resp = await client.post("/api/v1/runbook", json={
        "context_text": "Generate a runbook for privilege escalation alerts",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "runbook_id" in data
    assert "steps" in data
    assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_runbook_api_missing_context(client):
    resp = await client.post("/api/v1/runbook", json={"context_text": "   "})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_runbook_action_endpoint_streams_result(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Generate a runbook for privilege escalation alerts",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0]["handler"] == "runbook"
    data = result_events[0]["data"]
    assert "steps" in data
    assert len(data["steps"]) > 0


@pytest.mark.asyncio
async def test_runbook_playbook_routing(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Create a playbook for this alert type",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert result_events[0]["handler"] == "runbook"
