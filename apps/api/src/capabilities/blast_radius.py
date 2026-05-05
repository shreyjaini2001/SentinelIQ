"""
Capability 4 — Blast Radius Estimation
PRD §6.4: IAM graph traversal to quantify impact scope if an entity is compromised.
"""

import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from src.providers import get_data_provider


class ReachableAsset(BaseModel):
    asset_id: str
    asset_type: str  # user | host | group | role | service_principal
    name: str
    risk_level: str  # critical | high | medium | low
    path: str


class BlastRadiusResult(BaseModel):
    blast_id: str
    seed_entity: str
    seed_entity_type: str  # user | host | unknown
    total_reachable_assets: int
    reachable_assets: list[ReachableAsset]
    privileged_paths: list[dict]
    risk_score: int  # 0-100
    containment_steps: list[str]
    estimated_scope: str
    duration_ms: int


_RISK_WEIGHTS = {"critical": 25, "high": 12, "medium": 5, "low": 2}

_RISK_FOR_GROUP = {
    "GRP-001": "critical",
    "GRP-002": "medium",
    "GRP-003": "high",
    "GRP-004": "high",
    "GRP-005": "medium",
    "GRP-006": "high",
    "GRP-007": "high",
}


def _classify_host_risk(host: dict) -> str:
    score = host.get("risk_score", 0)
    if score >= 85:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _resolve_seed(entity_str: str, dp) -> tuple[dict | None, str]:
    """Return (record, entity_type) for the seed entity string."""
    entity_lower = entity_str.lower()
    for u in dp.get_users():
        if entity_lower in (u["upn"].lower(), u["display_name"].lower(), u.get("user_id", "").lower()):
            return u, "user"
    for h in dp.get_hosts():
        if entity_lower in (h["device_name"].lower(), h["ip_address"].lower()):
            return h, "host"
    # Partial match fallback
    for u in dp.get_users():
        if entity_lower in u["upn"].lower() or entity_lower in u["display_name"].lower():
            return u, "user"
    for h in dp.get_hosts():
        if entity_lower in h["device_name"].lower():
            return h, "host"
    return None, "unknown"


def estimate_blast_radius(seed_entity: str) -> BlastRadiusResult:
    start = datetime.now(timezone.utc)
    dp = get_data_provider()
    iam = dp.get_iam_graph()
    users = dp.get_users()
    hosts = dp.get_hosts()

    record, entity_type = _resolve_seed(seed_entity, dp)

    # Determine the primary user ID to traverse from
    if entity_type == "user":
        user_id = record.get("user_id", "")
        display = record.get("display_name", seed_entity)
    elif entity_type == "host":
        owner_upn = record.get("owner_upn", "")
        owner = next((u for u in users if u["upn"].lower() == owner_upn.lower()), None)
        user_id = owner.get("user_id", "") if owner else ""
        display = record.get("device_name", seed_entity)
    else:
        user_id = ""
        display = seed_entity

    reachable: list[ReachableAsset] = []
    seen_ids: set[str] = set()

    def _add(asset_id, asset_type, name, risk_level, path):
        if asset_id not in seen_ids:
            seen_ids.add(asset_id)
            reachable.append(ReachableAsset(
                asset_id=asset_id,
                asset_type=asset_type,
                name=name,
                risk_level=risk_level,
                path=path,
            ))

    # Include the host itself if seed is a host
    if entity_type == "host" and record:
        _add(
            record.get("device_name", seed_entity),
            "host",
            record.get("device_name", seed_entity),
            _classify_host_risk(record),
            f"Direct compromise: {seed_entity}",
        )

    if user_id:
        seed_label = f"{display} ({seed_entity})"

        # Groups the user belongs to
        for grp in iam.get("groups", []):
            if user_id in grp.get("members", []):
                risk = _RISK_FOR_GROUP.get(grp["id"], "medium")
                _add(grp["id"], "group", grp["name"], risk, f"{seed_label} → {grp['name']}")

                # Members of those groups are also reachable (pivot targets)
                for member_id in grp.get("members", []):
                    if member_id == user_id:
                        continue
                    peer = next((u for u in users if u.get("user_id") == member_id), None)
                    if peer:
                        _add(
                            peer["user_id"],
                            "user",
                            peer["display_name"],
                            "medium",
                            f"{seed_label} → {grp['name']} → {peer['display_name']}",
                        )

        # Roles assigned to this user
        for role in iam.get("roles", []):
            if user_id in role.get("assigned_to", []):
                risk = role.get("risk", "medium")
                _add(role["id"], "role", role["name"], risk, f"{seed_label} → role: {role['name']}")

        # Service principals owned by this user
        for sp in iam.get("service_principals", []):
            if sp.get("owner") == user_id:
                _add(sp["id"], "service_principal", sp["name"], "high",
                     f"{seed_label} → owns {sp['name']}")

    # Privileged access paths involving this entity
    privileged_paths = []
    for path_obj in iam.get("privileged_access_paths", []):
        if (user_id and path_obj.get("from") == user_id) or seed_entity.lower() in path_obj.get("path", "").lower():
            privileged_paths.append(path_obj)
            # The destination of the privileged path is reachable
            dest_id = path_obj.get("to", "")
            dest_grp = next((g for g in iam.get("groups", []) if g["id"] == dest_id), None)
            if dest_grp:
                risk = _RISK_FOR_GROUP.get(dest_id, "high")
                _add(dest_id, "group", dest_grp["name"], risk,
                     f"Privileged path: {path_obj['path']}")
                # Members of the destination group are reachable
                for member_id in dest_grp.get("members", []):
                    target_user = next((u for u in users if u.get("user_id") == member_id), None)
                    if target_user:
                        _add(
                            target_user["user_id"],
                            "user",
                            target_user["display_name"],
                            "critical",
                            f"Privileged path → {dest_grp['name']} → {target_user['display_name']}",
                        )

    # Hosts reachable via Domain Admin (if user has or can reach that role)
    has_domain_admin = any(
        a.name == "Domain Admin" or a.asset_id == "GRP-001"
        for a in reachable
        if a.asset_type in ("role", "group")
    )
    if has_domain_admin:
        for host in hosts:
            hid = host["device_name"]
            if hid not in seen_ids:
                _add(hid, "host", hid, _classify_host_risk(host),
                     f"Domain Admin access → {hid}")

    # Hosts directly owned (for the seed user, or seed host itself)
    if entity_type == "user" and record:
        owned_upn = record.get("upn", "")
        for host in hosts:
            if host.get("owner_upn", "").lower() == owned_upn.lower():
                _add(host["device_name"], "host", host["device_name"],
                     _classify_host_risk(host),
                     f"Direct ownership: {display} owns {host['device_name']}")

    # Risk score: weighted sum capped at 100
    raw_score = sum(_RISK_WEIGHTS.get(a.risk_level, 2) for a in reachable)
    if privileged_paths:
        raw_score += 20
    risk_score = min(100, raw_score)

    # Containment steps based on entity type
    if entity_type == "user":
        containment_steps = [
            f"Immediately disable account: {record.get('upn', seed_entity) if record else seed_entity}",
            "Revoke all active sessions and OAuth tokens",
            "Reset credentials and enforce MFA re-enrollment",
            "Audit group memberships and remove from privileged groups",
            "Review and revoke service principal permissions owned by this account",
        ]
        if privileged_paths:
            containment_steps.append("Investigate and sever privileged access paths listed above")
        if has_domain_admin:
            containment_steps.append("Audit all Domain Controller activity for lateral movement indicators")
    elif entity_type == "host":
        containment_steps = [
            f"Isolate host from network: {seed_entity}",
            "Preserve memory dump and disk image for forensics",
            "Rotate credentials for all accounts that logged into this host",
            "Scan adjacent hosts for lateral movement artifacts",
        ]
        if record and record.get("owner_upn"):
            containment_steps.append(f"Audit owner account: {record['owner_upn']}")
    else:
        containment_steps = [
            "Identify and verify entity before containment",
            "Isolate affected network segments",
            "Review recent authentication events for this entity",
        ]

    # Scope summary
    critical_count = sum(1 for a in reachable if a.risk_level == "critical")
    high_count = sum(1 for a in reachable if a.risk_level == "high")
    if critical_count >= 3 or risk_score >= 80:
        scope = f"CRITICAL — {len(reachable)} assets reachable including {critical_count} critical. Immediate containment required."
    elif risk_score >= 50:
        scope = f"HIGH — {len(reachable)} assets reachable including {high_count} high-risk. Prioritize containment within 1 hour."
    elif len(reachable) > 0:
        scope = f"MEDIUM — {len(reachable)} assets reachable. Investigate and contain within 4 hours."
    else:
        scope = "LOW — Limited blast radius detected. Monitor for lateral movement."

    end = datetime.now(timezone.utc)
    duration_ms = int((end - start).total_seconds() * 1000)

    return BlastRadiusResult(
        blast_id=str(uuid.uuid4()),
        seed_entity=seed_entity,
        seed_entity_type=entity_type,
        total_reachable_assets=len(reachable),
        reachable_assets=reachable,
        privileged_paths=privileged_paths,
        risk_score=risk_score,
        containment_steps=containment_steps,
        estimated_scope=scope,
        duration_ms=duration_ms,
    )
