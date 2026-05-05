"""
FixtureDataProvider — loads all security data from JSON fixture files.
Used when MOCK_LLM=true. Provides realistic, consistent demo data
without requiring any SIEM connection.
"""
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from src.providers.data.base import DataProvider

_FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "fixtures"


def _load(filename: str) -> dict | list:
    path = _FIXTURE_DIR / filename
    return json.loads(path.read_text(encoding="utf-8"))


class FixtureDataProvider(DataProvider):
    def __init__(self) -> None:
        self._alerts: list[dict] = _load("alerts.json")
        self._auth_events: list[dict] = _load("auth_events.json")
        self._endpoint_events: list[dict] = _load("endpoint_events.json")
        self._network_events: list[dict] = _load("network_events.json")
        self._users: list[dict] = _load("users.json")
        self._hosts: list[dict] = _load("hosts.json")
        self._incidents: list[dict] = _load("incidents.json")
        self._detection_rules: list[dict] = _load("detection_rules.json")
        self._baselines: dict = _load("baselines.json")
        self._attack_techniques: dict = _load("attack_techniques.json")
        self._iam_graph: dict = _load("iam_graph.json")
        self._past_investigations: list[dict] = _load("past_investigations.json")

        # Build lookup maps
        self._user_by_entity: dict[str, dict] = {}
        for u in self._users:
            self._user_by_entity[u["upn"].lower()] = u
            self._user_by_entity[u["display_name"].lower()] = u

        self._host_by_entity: dict[str, dict] = {}
        for h in self._hosts:
            self._host_by_entity[h["device_name"].lower()] = h
            self._host_by_entity[h["ip_address"]] = h

    # ── Alerts ───────────────────────────────────────────────────────────────

    def get_alerts(self, n: int = 5) -> list[dict]:
        return self._alerts[:n]

    # ── Events ────────────────────────────────────────────────────────────────

    def _events_for_entity(self, events: list[dict], entity: str) -> list[dict]:
        entity_lower = entity.lower()
        return [
            e for e in events
            if entity_lower in e.get("entity", "").lower()
            or entity_lower in e.get("description", "").lower()
        ]

    def get_auth_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        matches = self._events_for_entity(self._auth_events, entity)
        return self._rebase_to_window(matches, window_start, window_end)

    def get_endpoint_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        matches = self._events_for_entity(self._endpoint_events, entity)
        return self._rebase_to_window(matches, window_start, window_end)

    def get_network_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        matches = self._events_for_entity(self._network_events, entity)
        return self._rebase_to_window(matches, window_start, window_end)

    def _rebase_to_window(
        self, events: list[dict], window_start: datetime, window_end: datetime
    ) -> list[dict]:
        """Shift fixture timestamps so they fall within the requested window."""
        if not events:
            return []
        window_duration = (window_end - window_start).total_seconds()
        rebased = []
        for i, ev in enumerate(events):
            offset_frac = i / max(len(events), 1)
            new_ts = window_start + timedelta(seconds=window_duration * offset_frac)
            rebased.append({**ev, "timestamp": new_ts.isoformat()})
        return rebased

    # ── ATT&CK / Threat intel ─────────────────────────────────────────────────

    def get_attack_techniques(self) -> dict[str, dict]:
        return self._attack_techniques

    def get_threat_actors(self) -> dict[str, list[str]]:
        actors: dict[str, list[str]] = {}
        for tid, tech in self._attack_techniques.items():
            for actor in tech.get("threat_actors", []):
                actors.setdefault(actor, []).append(tid)
        return actors

    # ── Identity & assets ────────────────────────────────────────────────────

    def get_users(self) -> list[dict]:
        return self._users

    def get_hosts(self) -> list[dict]:
        return self._hosts

    def get_incidents(self) -> list[dict]:
        return self._incidents

    def get_detection_rules(self) -> list[dict]:
        return self._detection_rules

    def get_baselines(self) -> dict:
        return self._baselines

    # ── Convenience helpers used by capabilities ──────────────────────────────

    def get_iam_graph(self) -> dict:
        return self._iam_graph

    def get_past_investigations(self) -> list[dict]:
        return self._past_investigations

    def resolve_entity(self, entity: str) -> dict | None:
        """Return user or host record for a given entity string."""
        el = entity.lower()
        return (
            self._user_by_entity.get(el)
            or self._host_by_entity.get(el)
            or self._host_by_entity.get(entity)
        )

    def get_all_events_for_entity(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        """Merge auth + endpoint + network events, sorted by timestamp."""
        all_events = (
            self.get_auth_events(entity, window_start, window_end)
            + self.get_endpoint_events(entity, window_start, window_end)
            + self.get_network_events(entity, window_start, window_end)
        )
        all_events.sort(key=lambda e: e.get("timestamp", ""))
        return all_events
