"""
RealSIEMProvider — placeholder for Phase 2 Azure Sentinel / KQL integration.
All methods raise NotImplementedError until the connector is built.
"""
from datetime import datetime
from src.providers.data.base import DataProvider


class RealSIEMProvider(DataProvider):
    """
    Phase 2 target: executes KQL against Azure Sentinel workspace.
    Set SIEM_WORKSPACE_ID and SIEM_CLIENT_ID/SECRET in .env to enable.
    """

    def _not_ready(self, method: str):
        raise NotImplementedError(
            f"RealSIEMProvider.{method} is pending Phase 2 implementation. "
            "Set MOCK_LLM=true to use fixture data."
        )

    def get_alerts(self, n: int = 5) -> list[dict]:
        self._not_ready("get_alerts")

    def get_auth_events(self, entity: str, window_start: datetime, window_end: datetime) -> list[dict]:
        self._not_ready("get_auth_events")

    def get_endpoint_events(self, entity: str, window_start: datetime, window_end: datetime) -> list[dict]:
        self._not_ready("get_endpoint_events")

    def get_network_events(self, entity: str, window_start: datetime, window_end: datetime) -> list[dict]:
        self._not_ready("get_network_events")

    def get_attack_techniques(self) -> dict[str, dict]:
        self._not_ready("get_attack_techniques")

    def get_threat_actors(self) -> dict[str, list[str]]:
        self._not_ready("get_threat_actors")

    def get_users(self) -> list[dict]:
        self._not_ready("get_users")

    def get_hosts(self) -> list[dict]:
        self._not_ready("get_hosts")

    def get_incidents(self) -> list[dict]:
        self._not_ready("get_incidents")

    def get_detection_rules(self) -> list[dict]:
        self._not_ready("get_detection_rules")

    def get_baselines(self) -> dict:
        self._not_ready("get_baselines")
