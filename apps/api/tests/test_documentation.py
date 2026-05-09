"""Tests for Capability 5 — One-Click Documentation."""
import json
import pytest
from httpx import AsyncClient, ASGITransport
from src.capabilities.documentation import generate_documentation, DocumentationResult
from src.handlers.documentation_handler import _pick_variant


# ── _pick_variant unit tests ─────────────────────────────────────────────────

def test_pick_variant_executive_summary():
    assert _pick_variant("Generate an executive summary for this investigation") == "executive"

def test_pick_variant_technical_report():
    assert _pick_variant("Write a technical report") == "technical"

def test_pick_variant_regulatory_report():
    assert _pick_variant("Generate a regulatory report") == "regulatory"

def test_pick_variant_board():
    assert _pick_variant("Write a board-level briefing") == "executive"

def test_pick_variant_hipaa():
    assert _pick_variant("Create a HIPAA compliance report") == "regulatory"

def test_pick_variant_default_technical():
    assert _pick_variant("") == "technical"
    assert _pick_variant("document this incident") == "technical"


# ── Action endpoint variant routing tests ────────────────────────────────────

def _parse_sse(text: str) -> list[dict]:
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
                events.append({"type": event_type, **json.loads(data_str)})
            except json.JSONDecodeError:
                pass
    return events


@pytest.mark.asyncio
async def test_action_documentation_executive_variant(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "Generate an executive summary for this investigation",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0].get("handler") == "documentation"
    assert result_events[0]["data"]["variant"] == "executive"


@pytest.mark.asyncio
async def test_action_documentation_technical_variant(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "Write a technical report for this incident",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0].get("handler") == "documentation"
    assert result_events[0]["data"]["variant"] == "technical"


@pytest.mark.asyncio
async def test_action_documentation_regulatory_variant(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    resp = await client.post("/api/v1/action", json={
        "text": "Generate a regulatory report for this breach",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0].get("handler") == "documentation"
    assert result_events[0]["data"]["variant"] == "regulatory"


# ── Unit tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_documentation_technical():
    result = await generate_documentation(
        variant="technical",
        entity_scope="jsmith@corp.com",
        context_text="Suspicious login from RU followed by lateral movement to FILE-SRV01.",
    )
    assert isinstance(result, DocumentationResult)
    assert result.variant == "technical"
    assert len(result.sections) >= 1
    assert len(result.raw_markdown) > 100
    assert result.entity_scope == "jsmith@corp.com"


@pytest.mark.asyncio
async def test_documentation_executive():
    result = await generate_documentation(
        variant="executive",
        entity_scope="jsmith@corp.com",
        context_text="Finance account compromised.",
    )
    assert result.variant == "executive"
    assert len(result.raw_markdown) > 50


@pytest.mark.asyncio
async def test_documentation_regulatory():
    result = await generate_documentation(
        variant="regulatory",
        entity_scope="INC-2026-0042",
        context_text="Potential data breach involving Finance team files.",
    )
    assert result.variant == "regulatory"
    assert len(result.sections) >= 1


@pytest.mark.asyncio
async def test_documentation_model_fields():
    result = await generate_documentation(
        variant="technical",
        entity_scope="SERVER-DC01",
        context_text="LSASS access detected.",
    )
    d = result.model_dump()
    required = {"doc_id", "variant", "title", "sections", "raw_markdown",
                "generated_at", "entity_scope", "duration_ms"}
    assert required.issubset(d.keys())


@pytest.mark.asyncio
async def test_documentation_sections_have_heading_and_body():
    result = await generate_documentation(
        variant="technical",
        entity_scope="jsmith@corp.com",
        context_text="Active incident.",
    )
    for section in result.sections:
        assert isinstance(section.heading, str)
        assert isinstance(section.body, str)
        assert len(section.heading) > 0


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_documentation_api_technical():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/documentation", json={
            "variant": "technical",
            "entity_scope": "jsmith@corp.com",
            "context_text": "Suspicious login detected.",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["variant"] == "technical"
    assert "doc_id" in data
    assert len(data["sections"]) >= 1


@pytest.mark.asyncio
async def test_documentation_api_executive():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/documentation", json={
            "variant": "executive",
            "entity_scope": "Finance team",
        })
    assert resp.status_code == 200
    assert resp.json()["variant"] == "executive"


@pytest.mark.asyncio
async def test_documentation_api_regulatory():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/documentation", json={
            "variant": "regulatory",
            "entity_scope": "INC-2026-0042",
        })
    assert resp.status_code == 200
    assert resp.json()["variant"] == "regulatory"
