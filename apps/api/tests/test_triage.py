import pytest


@pytest.mark.asyncio
async def test_triage_sample_alerts(client):
    resp = await client.post("/api/v1/triage", json={"use_sample": True, "sample_count": 5})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_alerts"] == 5
    assert isinstance(data["verdicts"], list)
    assert len(data["verdicts"]) == 5


@pytest.mark.asyncio
async def test_triage_verdict_fields(client):
    resp = await client.post("/api/v1/triage", json={"use_sample": True, "sample_count": 3})
    assert resp.status_code == 200
    for verdict in resp.json()["verdicts"]:
        assert "alert_id" in verdict
        assert 0 <= verdict["tp_probability"] <= 100
        assert 0 <= verdict["fp_probability"] <= 100
        assert verdict["confidence"] in ("high", "medium", "low")
        assert len(verdict["reasoning"]) > 10
        assert isinstance(verdict["influencing_fields"], list)


@pytest.mark.asyncio
async def test_triage_summary_counts(client):
    resp = await client.post("/api/v1/triage", json={"use_sample": True, "sample_count": 5})
    data = resp.json()
    total = data["likely_tp"] + data["likely_fp"] + data["uncertain"]
    assert total == data["total_alerts"]


@pytest.mark.asyncio
async def test_triage_fixture_alerts_are_diverse(client):
    resp = await client.post("/api/v1/triage", json={"use_sample": True, "sample_count": 5})
    verdicts = resp.json()["verdicts"]
    tp_scores = [v["tp_probability"] for v in verdicts]
    # With fixture data, scores should not all be identical
    assert len(set(tp_scores)) > 1, "All triage scores are identical — fixture diversity broken"


@pytest.mark.asyncio
async def test_triage_custom_alert(client):
    resp = await client.post("/api/v1/triage", json={
        "alerts": [{
            "alert_id": "TEST-001",
            "title": "LSASS memory dump detected",
            "severity": "critical",
            "rule_name": "CredentialDumping",
            "raw_log": {
                "ProcessCommandLine": "rundll32.exe comsvcs.dll MiniDump 624 lsass.dmp",
                "DeviceName": "SERVER-DC01",
            },
            "entity": "SERVER-DC01",
            "timestamp": "2026-05-04T00:38:00Z",
        }]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_alerts"] == 1
    verdict = data["verdicts"][0]
    assert verdict["alert_id"] == "TEST-001"


@pytest.mark.asyncio
async def test_triage_duration_ms_present(client):
    resp = await client.post("/api/v1/triage", json={"use_sample": True, "sample_count": 2})
    assert resp.status_code == 200
    assert resp.json()["duration_ms"] >= 0
