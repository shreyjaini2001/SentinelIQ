from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
import uuid


class Entity(BaseModel):
    type: Literal["user", "host", "ip", "process", "hash", "service"]
    value: str
    first_seen_in_session: datetime = Field(default_factory=datetime.utcnow)
    frequency: int = 1


class ResultSummary(BaseModel):
    query_id: str
    result_count: int
    top_entities: list[Entity] = []
    time_range_start: datetime | None = None
    time_range_end: datetime | None = None
    has_anomalies: bool = False


class QueryEntry(BaseModel):
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    original_text: str
    generated_query: str
    confidence: int
    mode: Literal["query", "action", "refine"]
    extracted_entities: list[Entity] = []
    result_count: int | None = None
    was_modified: bool = False
    execution_duration_ms: int | None = None


class SessionContext(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analyst_id: str = "default"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    query_history: list[QueryEntry] = []
    active_entities: list[Entity] = []
    current_results: ResultSummary | None = None
    active_investigation: str | None = None
    analyst_notes: list[str] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime | None = None
    compressed_summary: str | None = None
    turn_count: int = 0
