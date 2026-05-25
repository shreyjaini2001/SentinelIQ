import json
import re
import asyncio
import uuid
from datetime import datetime, timezone
from config import settings
from src.llm import client as llm
from src.llm.prompts import nlq_parse, nlq_resolve, nlq_construct, nlq_explain
from src.utils.kql_validator import validate_kql, sanitize_kql
from src.utils.time_parser import parse_time_range
from src.models.requests import (
    QueryResponse, QueryExplanation, ClauseExplanation, EntityResult, TimeRange
)


async def process_query(
    text: str,
    mode: str = "query",
    prior_query: str | None = None,
    target_language: str = "kql",
) -> QueryResponse:
    # Stage 1: Semantic parsing (fast LLM call)
    parsed = await _stage1_parse(text)

    # Stage 2: Descriptor resolution (Sonnet, most expensive)
    resolved = await _stage2_resolve(
        parsed.get("qualitative_descriptors", []),
        parsed.get("entities", []),
    )

    # Stage 3 + 4: Query construction + explanation (parallel)
    construction_task = _stage3_construct(parsed, resolved, prior_query, mode)
    explanation_input_task = asyncio.create_task(asyncio.sleep(0))  # placeholder start

    construction_result = await construction_task
    kql = sanitize_kql(construction_result.get("kql", ""))

    # Validate KQL
    is_valid, errors = validate_kql(kql)
    if not is_valid:
        kql = _fallback_kql(text, parsed)

    # Stage 4: Explanation (parallel-ish — runs after construction)
    explanation = await _stage4_explain(kql, resolved.get("resolved", []))

    # Stage 5: Confidence scoring
    confidence = _stage5_score(is_valid, parsed, resolved, construction_result)

    # Extract entities and time range
    entities = [
        EntityResult(type=e.get("type", "host"), value=e.get("value", ""))
        for e in parsed.get("entities", [])
    ]

    time_range = None
    tr = parse_time_range(text)
    if tr:
        start, end = tr
        time_range = TimeRange(
            start=start.isoformat(),
            end=end.isoformat(),
        )

    return QueryResponse(
        query_id=str(uuid.uuid4()),
        generated_query=kql,
        confidence=confidence,
        explanation=explanation,
        extracted_entities=entities,
        time_range=time_range,
        session_updated=True,
    )


async def _stage1_parse(text: str) -> dict:
    raw = await llm.complete(
        messages=nlq_parse.build_messages(text),
        system=nlq_parse.SYSTEM,
        model=settings.nlq_model,
        max_tokens=512,
        use_cache=True,
    )
    return _safe_json(raw, {})


async def _stage2_resolve(descriptors: list[str], entities: list[dict]) -> dict:
    if not descriptors:
        return {"resolved": []}
    raw = await llm.complete(
        messages=nlq_resolve.build_messages(descriptors, entities),
        system=nlq_resolve.SYSTEM,
        model=settings.nlq_model,
        max_tokens=512,
        use_cache=True,
    )
    return _safe_json(raw, {"resolved": []})


async def _stage3_construct(
    parsed: dict,
    resolved: dict,
    prior_query: str | None,
    mode: str,
) -> dict:
    raw = await llm.complete(
        messages=nlq_construct.build_messages(parsed, resolved, prior_query, mode),
        system=nlq_construct.SYSTEM,
        model=settings.nlq_model,
        max_tokens=1024,
        use_cache=True,
    )
    return _safe_json(raw, {"kql": ""})


async def _stage4_explain(kql: str, resolved: list[dict]) -> QueryExplanation:
    raw = await llm.complete(
        messages=nlq_explain.build_messages(kql, resolved),
        system=nlq_explain.SYSTEM,
        model=settings.nlq_model,
        max_tokens=512,
        use_cache=True,
    )
    data = _safe_json(raw, {})
    clauses = [
        ClauseExplanation(
            clause=c.get("clause", ""),
            plain_english=c.get("plain_english", ""),
        )
        for c in data.get("clauses", [])
    ]
    return QueryExplanation(
        summary=data.get("summary", "Query generated from natural language input."),
        clauses=clauses,
        assumptions=data.get("assumptions", []),
    )


def _stage5_score(
    kql_valid: bool,
    parsed: dict,
    resolved: dict,
    construction: dict,
) -> int:
    score = 100
    if not kql_valid:
        score -= 30
    if not parsed.get("entities"):
        score -= 10
    if not parsed.get("behaviors"):
        score -= 10
    unresolved = [
        d for d in parsed.get("qualitative_descriptors", [])
        if not any(r.get("descriptor") == d for r in resolved.get("resolved", []))
    ]
    score -= len(unresolved) * 5
    return max(0, min(100, score))


def _fallback_kql(text: str, parsed: dict) -> str:
    behaviors = parsed.get("behaviors", [])

    # For inventory intents, produce an appropriate summary query rather than a text search.
    # These behaviors are set by _parse_semantic() when the prompt is clearly an inventory request.
    if "user_inventory" in behaviors:
        # Prefer SigninLogs summary — mirrors IdentityInfo intent when that table path fails
        return (
            "SigninLogs\n"
            "| where TimeGenerated > ago(24h)\n"
            "| summarize LastSeen=max(TimeGenerated), SignInEvents=count(), "
            "FailedSignIns=countif(ResultType != 0), IPs=make_set(IPAddress, 5), "
            "Locations=make_set(Location, 5) by UserPrincipalName\n"
            "| order by LastSeen desc"
        )
    if "observed_users" in behaviors:
        return (
            "SigninLogs\n"
            "| where TimeGenerated > ago(24h)\n"
            "| summarize LastSeen=max(TimeGenerated), SignInEvents=count(), "
            "FailedSignIns=countif(ResultType != 0), IPs=make_set(IPAddress, 5) by UserPrincipalName\n"
            "| order by LastSeen desc"
        )
    if "host_inventory" in behaviors:
        return (
            "SecurityEvent\n"
            "| where TimeGenerated > ago(24h)\n"
            "| where isnotempty(Computer)\n"
            "| summarize LastSeen=max(TimeGenerated), Events=count(), UniqueUsers=dcount(Account) by Computer\n"
            "| order by Events desc"
        )
    if "ip_inventory" in behaviors:
        return (
            "DeviceNetworkEvents\n"
            "| where TimeGenerated > ago(24h)\n"
            '| where RemoteIPType == "Public"\n'
            "| summarize Connections=count(), Hosts=make_set(DeviceName, 5), "
            "FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated) by RemoteIP\n"
            "| order by Connections desc"
        )
    if "process_inventory" in behaviors:
        return (
            "DeviceProcessEvents\n"
            "| where TimeGenerated > ago(24h)\n"
            "| summarize Executions=count(), Hosts=make_set(DeviceName, 5), "
            "Users=make_set(AccountName, 5), FirstSeen=min(TimeGenerated) by FileName\n"
            "| order by Executions desc"
        )

    # Generic last-resort fallback — only for truly unrecognised intent
    return f'SecurityEvent\n| where TimeGenerated > ago(24h)\n| search "{text}"\n| limit 100'


def _safe_json(raw: str, default: dict) -> dict:
    try:
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return default
