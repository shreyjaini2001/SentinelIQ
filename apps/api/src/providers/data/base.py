from abc import ABC, abstractmethod
from datetime import datetime


class DataProvider(ABC):
    """
    Contract for security data backends.
    FixtureDataProvider loads from JSON files.
    RealSIEMProvider executes KQL against Azure Sentinel (Phase 2).
    """

    @abstractmethod
    def get_alerts(self, n: int = 5) -> list[dict]:
        """Return n open/recent alerts."""
        ...

    @abstractmethod
    def get_auth_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        """Return authentication events (SigninLogs) for entity in window."""
        ...

    @abstractmethod
    def get_endpoint_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        """Return process/file events (DeviceProcessEvents) for entity in window."""
        ...

    @abstractmethod
    def get_network_events(
        self, entity: str, window_start: datetime, window_end: datetime
    ) -> list[dict]:
        """Return network events (DeviceNetworkEvents) for entity in window."""
        ...

    @abstractmethod
    def get_attack_techniques(self) -> dict[str, dict]:
        """Return ATT&CK technique catalog keyed by technique_id."""
        ...

    @abstractmethod
    def get_threat_actors(self) -> dict[str, list[str]]:
        """Return threat actor → [technique_id] mapping."""
        ...

    @abstractmethod
    def get_users(self) -> list[dict]:
        """Return user/identity records."""
        ...

    @abstractmethod
    def get_hosts(self) -> list[dict]:
        """Return host/device inventory."""
        ...

    @abstractmethod
    def get_incidents(self) -> list[dict]:
        """Return grouped incidents (linked alert sets)."""
        ...

    @abstractmethod
    def get_detection_rules(self) -> list[dict]:
        """Return active detection rules."""
        ...

    @abstractmethod
    def get_baselines(self) -> dict:
        """Return historical baseline statistics."""
        ...

    @abstractmethod
    def get_iam_graph(self) -> dict:
        """Return IAM graph with groups, roles, service_principals, privileged_access_paths."""
        ...

    @abstractmethod
    def get_past_investigations(self) -> list[dict]:
        """Return past investigation records for context and rule suggestion."""
        ...
