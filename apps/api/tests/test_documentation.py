"""Tests for Capability 5 — One-Click Documentation."""
import pytest
from httpx import AsyncClient, ASGITransport
from src.capabilities.documentation import generate_documentation, DocumentationResult


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
