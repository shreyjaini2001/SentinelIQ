from pydantic import BaseModel
from typing import Literal


class ClassifyRequest(BaseModel):
    text: str
    session_id: str | None = None


class DisambiguationChip(BaseModel):
    label: str
    mode: Literal["query", "action", "refine"]


class ClassifyResponse(BaseModel):
    mode: Literal["query", "action", "refine"]
    intent_label: str
    confidence: float
    extracted_entities: list[str]
    disambiguation_chips: list[DisambiguationChip] = []


class QueryRequest(BaseModel):
    text: str
    session_id: str
    mode: Literal["query", "refine"] = "query"
    target_language: Literal["kql", "spl", "eql"] = "kql"


class ClauseExplanation(BaseModel):
    clause: str
    plain_english: str


class QueryExplanation(BaseModel):
    summary: str
    clauses: list[ClauseExplanation]
    assumptions: list[str]


class EntityResult(BaseModel):
    type: str
    value: str


class TimeRange(BaseModel):
    start: str
    end: str


class QueryResponse(BaseModel):
    query_id: str
    generated_query: str
    confidence: int
    explanation: QueryExplanation
    extracted_entities: list[EntityResult]
    time_range: TimeRange | None
    session_updated: bool = True


class ActionRequest(BaseModel):
    text: str
    session_id: str
    confirmed_handler: str | None = None


class ShareSessionResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: str


class SuggestionChip(BaseModel):
    id: str
    label: str
    type: Literal["query", "action"]
    prompt_text: str


class SuggestionsResponse(BaseModel):
    chips: list[SuggestionChip]


class AutocompleteCompletion(BaseModel):
    text: str
    source: Literal["history", "template", "team_pool"]
    recency_score: float


class AutocompleteResponse(BaseModel):
    completions: list[AutocompleteCompletion]
