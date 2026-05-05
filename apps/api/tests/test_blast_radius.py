"""Tests for Capability 4 — Blast Radius Estimation."""
import pytest
from httpx import AsyncClient, ASGITransport
from src.capabilities.blast_radius import estimate_blast_radius, BlastRadiusResult


# ── Unit tests (no server) ────────────────────────────────────────────────────

def test_blast_radius_user_entity():
    result = estimate_blast_radius("jsmith@corp.com")
    assert isinstance(result, BlastRadiusResult)
    assert result.seed_entity == "jsmith@corp.com"
    assert result.seed_entity_type == "user"
    assert result.total_reachable_assets >= 1
    assert 0 <= result.risk_score <= 100
    assert len(result.containment_steps) >= 1


def test_blast_radius_has_reachable_assets():
    result = estimate_blast_radius("jsmith@corp.com")
    # jsmith is in Finance-Users (GRP-002) and VPN-Users (GRP-005)
    asset_names = [a.name for a in result.reachable_assets]
    assert any("Finance" in name or "VPN" in name for name in asset_names)


def test_blast_radius_privileged_path():
    result = estimate_blast_radius("jsmith@corp.com")
    # jsmith has a privileged path to Domain-Admins via DESKTOP-42
    assert len(result.privileged_paths) >= 1
    path_strs = [p.get("path", "") for p in result.privileged_paths]
    assert any("DESKTOP-42" in p or "U001" in p for p in path_strs)


def test_blast_radius_domain_admin_reachable():
    result = estimate_blast_radius("jsmith@corp.com")
    # Via privileged path, Domain Admins group is reachable
    asset_names = [a.name for a in result.reachable_assets]
    assert any("Domain" in name or "Admin" in name for name in asset_names)


def test_blast_radius_host_entity():
    result = estimate_blast_radius("DESKTOP-42")
    assert result.seed_entity_type == "host"
    assert result.total_reachable_assets >= 1


def test_blast_radius_host_owner_traversal():
    result = estimate_blast_radius("DESKTOP-42")
    # DESKTOP-42 is owned by jsmith — should traverse jsmith's graph
    asset_names = [a.name for a in result.reachable_assets]
    assert len(asset_names) >= 1


def test_blast_radius_unknown_entity():
    result = estimate_blast_radius("unknown@example.com")
    assert result.seed_entity_type == "unknown"
    assert isinstance(result.risk_score, int)
    assert isinstance(result.containment_steps, list)


def test_blast_radius_model_dump():
    result = estimate_blast_radius("jsmith@corp.com")
    d = result.model_dump()
    required = {"blast_id", "seed_entity", "seed_entity_type", "total_reachable_assets",
                "reachable_assets", "privileged_paths", "risk_score", "containment_steps",
                "estimated_scope", "duration_ms"}
    assert required.issubset(d.keys())


# ── API endpoint tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_blast_radius_api_user():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/blast-radius", json={"seed_entity": "jsmith@corp.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["seed_entity"] == "jsmith@corp.com"
    assert data["total_reachable_assets"] >= 1
    assert 0 <= data["risk_score"] <= 100


@pytest.mark.asyncio
async def test_blast_radius_api_host():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/blast-radius", json={"seed_entity": "SERVER-DC01"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["seed_entity_type"] in ("host", "unknown")


@pytest.mark.asyncio
async def test_blast_radius_api_missing_entity():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/blast-radius", json={"seed_entity": "   "})
    assert resp.status_code == 400
