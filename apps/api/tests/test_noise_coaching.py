"""Tests for Capability 10 — Noise Reduction Coaching."""
import json
import pytest
from src.capabilities.noise_coaching import analyze_noise, NoiseCoachingResult
from src.models.session import SessionContext


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
async def test_noise_coaching_returns_result():
    result = await analyze_noise("Why does GeoAnomalyLogin fire so often?", "GeoAnomalyLogin")
    assert isinstance(result, NoiseCoachingResult)
    assert result.coaching_id


@pytest.mark.asyncio
async def test_noise_coaching_geoanomaly_rule():
    result = await analyze_noise("noise from GeoAnomalyLogin rule", "GeoAnomalyLogin")
    assert result.rule_name == "GeoAnomalyLogin"
    assert result.current_fp_rate > 0
    assert len(result.fp_clusters) > 0


@pytest.mark.asyncio
async def test_noise_coaching_fp_clusters_have_fields():
    result = await analyze_noise("tune this rule", "EncodedPowerShell")
    for cluster in result.fp_clusters:
        assert cluster.cluster_id
        assert cluster.description
        assert cluster.alert_count > 0
        assert isinstance(cluster.representative_fields, dict)


@pytest.mark.asyncio
async def test_noise_coaching_has_tuning_recommendations():
    result = await analyze_noise("Why does GeoAnomalyLogin fire?", "GeoAnomalyLogin")
    assert len(result.tuning_recommendations) > 0
    for rec in result.tuning_recommendations:
        assert rec.recommendation_id
        assert rec.field_name
        assert rec.suggested_condition
        assert 0 < rec.estimated_reduction_pct <= 1.0
        assert rec.rationale


@pytest.mark.asyncio
async def test_noise_coaching_before_after_fp_rate():
    result = await analyze_noise("alert fatigue from GeoAnomalyLogin", "GeoAnomalyLogin")
    assert result.before_fp_rate > result.after_fp_rate
    assert result.after_fp_rate >= 0


@pytest.mark.asyncio
async def test_noise_coaching_estimated_reduction():
    result = await analyze_noise("reduce noise from geo rule", "GeoAnomalyLogin")
    assert 0 < result.estimated_alert_reduction_pct <= 1.0


@pytest.mark.asyncio
async def test_noise_coaching_has_impact_preview():
    result = await analyze_noise("too many false positives from GeoAnomalyLogin")
    assert len(result.impact_preview) > 20


@pytest.mark.asyncio
async def test_noise_coaching_has_rollback_notes():
    result = await analyze_noise("help me tune the EncodedPowerShell rule", "EncodedPowerShell")
    assert result.rollback_notes
    assert len(result.rollback_notes) > 10


@pytest.mark.asyncio
async def test_noise_coaching_has_top_fp_fields():
    result = await analyze_noise("noise coaching for GeoAnomalyLogin")
    assert len(result.top_fp_fields) > 0


@pytest.mark.asyncio
async def test_noise_coaching_model_fields():
    result = await analyze_noise("why does this rule fire so often?")
    d = result.model_dump()
    required = {"coaching_id", "rule_name", "rule_description", "current_fp_rate",
                "fp_clusters", "top_fp_fields", "tuning_recommendations",
                "estimated_alert_reduction_pct", "before_fp_rate", "after_fp_rate",
                "impact_preview", "rollback_notes", "duration_ms"}
    assert required.issubset(d.keys())


@pytest.mark.asyncio
async def test_noise_coaching_defaults_to_highest_fp_rule():
    result = await analyze_noise("why does this rule fire so often?")
    assert result.rule_name  # should resolve to a rule, not crash


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_noise_coaching_api(client):
    resp = await client.post("/api/v1/noise-coaching", json={
        "context_text": "Why does GeoAnomalyLogin fire so often?",
        "rule_name_hint": "GeoAnomalyLogin",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["rule_name"] == "GeoAnomalyLogin"
    assert "tuning_recommendations" in data
    assert "fp_clusters" in data


@pytest.mark.asyncio
async def test_noise_coaching_api_missing_context(client):
    resp = await client.post("/api/v1/noise-coaching", json={"context_text": "  "})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_noise_coaching_action_endpoint_streams_result(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does GeoAnomalyLogin fire so often? Help me tune it",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0]["handler"] == "noise_coaching"
    data = result_events[0]["data"]
    assert "fp_clusters" in data
    assert "tuning_recommendations" in data


@pytest.mark.asyncio
async def test_noise_coaching_tune_routing(client):
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Help me tune this alert — too many false positives",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert result_events[0]["handler"] == "noise_coaching"


@pytest.mark.asyncio
async def test_noise_coaching_geoanomaly_fire_so_often_routing(client):
    """'Why does X fire so often?' must route to noise_coaching without a secondary trigger."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does GeoAnomalyLogin fire so often?",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0]["handler"] == "noise_coaching"
    data = result_events[0]["data"]
    assert data["rule_name"] == "GeoAnomalyLogin"
    assert "fp_clusters" in data
    assert "tuning_recommendations" in data


@pytest.mark.asyncio
async def test_noise_coaching_this_rule_fire_so_often_routing(client):
    """'Why does this rule fire so often?' must route to noise_coaching."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does this rule fire so often?",
        "session_id": session_id,
    })
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    assert result_events[0]["handler"] == "noise_coaching"


@pytest.mark.asyncio
async def test_noise_coaching_geoanomaly_new_country_alias(client):
    """GeoAnomalyNewCountryLogin should resolve to the GeoAnomalyLogin profile."""
    result = await analyze_noise(
        "What's causing all this noise from rule GeoAnomalyNewCountryLogin?",
        "GeoAnomalyNewCountryLogin",
    )
    assert result.rule_name == "GeoAnomalyLogin"
    assert result.before_fp_rate == pytest.approx(0.12)
    assert len(result.fp_clusters) > 0


@pytest.mark.asyncio
async def test_noise_coaching_result_data_shape(client):
    """Verify the action result data has all fields the frontend NoiseCoachingPanel expects."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does GeoAnomalyLogin fire so often?",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    data = result_events[0]["data"]
    required_keys = {
        "coaching_id", "rule_name", "rule_description", "current_fp_rate",
        "fp_clusters", "top_fp_fields", "tuning_recommendations",
        "estimated_alert_reduction_pct", "before_fp_rate", "after_fp_rate",
        "impact_preview", "rollback_notes", "duration_ms",
    }
    assert required_keys.issubset(data.keys())


# ── Context-resolution and fallback tests ────────────────────────────────────

@pytest.mark.asyncio
async def test_noise_coaching_explicit_rule_name(client):
    """Explicit rule name in prompt → correct rule, no fallback note."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does GeoAnomalyLogin fire so often?",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    data = result_events[0]["data"]
    assert data["rule_name"] == "GeoAnomalyLogin"
    # No fallback note injected when rule is explicit
    assert "No specific rule was identified" not in data["impact_preview"]


@pytest.mark.asyncio
async def test_noise_coaching_alias_rule_name(client):
    """Alias rule name GeoAnomalyNewCountryLogin → resolves to GeoAnomalyLogin profile, no fallback note."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "What's causing all this noise from rule GeoAnomalyNewCountryLogin?",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    data = result_events[0]["data"]
    assert data["rule_name"] == "GeoAnomalyLogin"
    assert "No specific rule was identified" not in data["impact_preview"]


@pytest.mark.asyncio
async def test_noise_coaching_this_rule_with_session_context(client):
    """'this rule' after an explicit rule prompt → reuses the session's last_rule_hint."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]

    # First action establishes GeoAnomalyLogin in session context
    await client.post("/api/v1/action", json={
        "text": "Why does GeoAnomalyLogin fire so often?",
        "session_id": session_id,
    })

    # Second action uses "this rule" — should pick up GeoAnomalyLogin from session
    resp = await client.post("/api/v1/action", json={
        "text": "Why does this rule fire so often?",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    data = result_events[0]["data"]
    assert data["rule_name"] == "GeoAnomalyLogin"
    assert "No specific rule was identified" not in data["impact_preview"]


@pytest.mark.asyncio
async def test_noise_coaching_this_rule_without_context(client):
    """'this rule' on a fresh session → fallback note prepended to impact_preview."""
    sess = await client.post("/api/v1/session?analyst_id=test_analyst")
    session_id = sess.json()["session_id"]
    resp = await client.post("/api/v1/action", json={
        "text": "Why does this rule fire so often?",
        "session_id": session_id,
    })
    events = _parse_sse(resp.text)
    result_events = [e for e in events if e["type"] == "result"]
    assert len(result_events) == 1
    data = result_events[0]["data"]
    # Panel should render (handler and data present)
    assert result_events[0]["handler"] == "noise_coaching"
    # A clear fallback note should be visible in impact_preview
    assert "No specific rule was identified" in data["impact_preview"]
    # The rule name shown should be the highest-noise fixture rule
    assert data["rule_name"]  # not empty
