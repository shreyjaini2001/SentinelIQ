"""Tests for Capability 6 — Comparative Behavioral Analysis."""
import pytest
from httpx import AsyncClient, ASGITransport
from src.capabilities.comparative import compare_entity, ComparativeResult


# ── Unit tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_compare_jsmith_is_anomalous():
    result = await compare_entity("jsmith@corp.com", "24h")
    assert isinstance(result, ComparativeResult)
    assert result.entity == "jsmith@corp.com"
    # jsmith is flagged as compromised — should have anomalies
    anomalies = [m for m in result.metrics if m.anomaly]
    assert len(anomalies) >= 1
    assert result.overall_deviation_score >= 30


@pytest.mark.asyncio
async def test_compare_has_expected_metrics():
    result = await compare_entity("jsmith@corp.com", "24h")
    metric_names = {m.metric_name for m in result.metrics}
    assert "Daily Login Count" in metric_names
    assert "Failed Login Attempts" in metric_names
    assert "Outbound Data (MB/day)" in metric_names


@pytest.mark.asyncio
async def test_compare_metric_fields():
    result = await compare_entity("jsmith@corp.com", "24h")
    for m in result.metrics:
        assert isinstance(m.metric_name, str)
        assert isinstance(m.current_value, float)
        assert isinstance(m.baseline_value, float)
        assert isinstance(m.deviation_pct, float)
        assert isinstance(m.sigma, float)
        assert isinstance(m.anomaly, bool)
        assert m.baseline_value > 0


@pytest.mark.asyncio
async def test_compare_narrative_non_empty():
    result = await compare_entity("jsmith@corp.com", "24h")
    assert len(result.narrative) > 50


@pytest.mark.asyncio
async def test_compare_peer_percentile_range():
    result = await compare_entity("jsmith@corp.com", "24h")
    assert 0 <= result.peer_percentile <= 100


@pytest.mark.asyncio
async def test_compare_model_dump():
    result = await compare_entity("jsmith@corp.com", "24h")
    d = result.model_dump()
    required = {"comparative_id", "entity", "comparison_window", "metrics",
                "peer_percentile", "overall_deviation_score", "narrative", "duration_ms"}
    assert required.issubset(d.keys())


@pytest.mark.asyncio
async def test_compare_unknown_entity_uses_defaults():
    result = await compare_entity("unknown@example.com", "24h")
    assert len(result.metrics) >= 5
    # Unknown entity uses default (normal) values
    assert result.overall_deviation_score <= 30


@pytest.mark.asyncio
async def test_compare_dc01_elevated():
    result = await compare_entity("server-dc01", "24h")
    assert result.overall_deviation_score >= 30


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_comparative_api():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/comparative", json={
            "entity": "jsmith@corp.com",
            "window": "24h",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["entity"] == "jsmith@corp.com"
    assert "metrics" in data
    assert len(data["metrics"]) >= 5
    assert 0 <= data["overall_deviation_score"] <= 100


@pytest.mark.asyncio
async def test_comparative_api_missing_entity():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/comparative", json={"entity": ""})
    assert resp.status_code == 400
