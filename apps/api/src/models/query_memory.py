from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class QueryTemplate(BaseModel):
    template_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analyst_id: str
    name: str
    query_text: str
    parameters: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    use_count: int = 0


class HistoricalQuery(BaseModel):
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analyst_id: str
    text: str
    generated_query: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    result_count: int | None = None
    was_successful: bool = False
    session_id: str


class TeamPoolEntry(BaseModel):
    pool_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    anonymized_text: str
    use_count: int = 1
    last_used: datetime = Field(default_factory=datetime.utcnow)
    category: str = "general"
