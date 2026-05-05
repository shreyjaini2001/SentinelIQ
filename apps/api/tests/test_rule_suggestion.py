"""Tests for Capability 7 — Enhanced Rule Suggestion."""
import pytest
from httpx import AsyncClient, ASGITransport
from src.capabilities.rule_suggestion import suggest_rule, RuleSuggestionResult


# ── Unit tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rule_suggestion_geo():
    result = await suggest_rule("Geo-anomaly login from Russia for jsmith@corp.com")
    assert isinstance(result, RuleSuggestionResult)
    assert len(result.kql) > 50
    assert result.severity in ("critical", "high", "medium", "low")
    assert 0.0 <= result.estimated_fp_rate <= 1.0


@pytest.mark.asyncio
async def test_rule_suggestion_powershell():
    result = await suggest_rule("Encoded PowerShell executions on DESKTOP-42")
    assert "powershell" in result.kql.lower() or "encoded" in result.kql.lower()
    assert len(result.technique_ids) >= 1


@pytest.mark.asyncio
async def test_rule_suggestion_lateral():
    result = await suggest_rule("SMB lateral movement — account accessed 7 systems via event 4648")
    assert len(result.kql) > 20
    assert len(result.mitre_tactics) >= 1


@pytest.mark.asyncio
async def test_rule_suggestion_backtest_fields():
    result = await suggest_rule("Suspicious auth pattern")
    bt = result.backtest
    assert bt.period == "30d"
    assert bt.alert_count >= 1
    assert bt.tp_count + bt.fp_count == bt.alert_count
    assert 0.0 <= bt.estimated_fp_rate <= 1.0


@pytest.mark.asyncio
async def test_rule_suggestion_similar_rules():
    result = await suggest_rule("Geo-anomaly login — SigninLogs T1078")
    # GeoAnomalyLogin should appear as similar (T1078 overlap)
    assert isinstance(result.similar_rules, list)
    if result.similar_rules:
        sr = result.similar_rules[0]
        assert 0.0 <= sr.similarity_score <= 1.0
        assert len(sr.rule_id) > 0


@pytest.mark.asyncio
async def test_rule_suggestion_false_positive_guidance():
    result = await suggest_rule("Detect LSASS memory access")
    assert len(result.false_positive_guidance) > 10


@pytest.mark.asyncio
async def test_rule_suggestion_model_fields():
    result = await suggest_rule("Hunt for credential dumping indicators")
    d = result.model_dump()
    required = {"suggestion_id", "rule_name", "rule_description", "kql", "severity",
                "technique_ids", "mitre_tactics", "false_positive_guidance",
                "estimated_fp_rate", "backtest", "similar_rules",
                "tuning_recommendations", "duration_ms"}
    assert required.issubset(d.keys())


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rule_suggestion_api():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/rule-suggestion", json={
            "context_text": "Geo-anomaly login from RU for jsmith@corp.com — SigninLogs",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert "rule_name" in data
    assert "kql" in data
    assert "backtest" in data
    assert "similar_rules" in data
    assert 0.0 <= data["estimated_fp_rate"] <= 1.0


@pytest.mark.asyncio
async def test_rule_suggestion_api_missing_context():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/rule-suggestion", json={"context_text": "  "})
    assert resp.status_code == 400
