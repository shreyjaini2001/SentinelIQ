import json
import uuid
from datetime import datetime, timezone
from src.models.query_memory import HistoricalQuery, QueryTemplate, TeamPoolEntry
from src.storage.db import DB_PATH
import aiosqlite


def _parse_utc(value: str) -> datetime:
    """Parse an ISO timestamp string and always return a UTC-aware datetime.
    Handles rows written before timezone info was stored consistently."""
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def save_query(query: HistoricalQuery) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO query_history
               (query_id, analyst_id, session_id, text, generated_query, timestamp, result_count, was_successful)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                query.query_id,
                query.analyst_id,
                query.session_id,
                query.text,
                query.generated_query,
                query.timestamp.isoformat(),
                query.result_count,
                1 if query.was_successful else 0,
            ),
        )
        await db.commit()


async def get_recent_queries(analyst_id: str, limit: int = 50) -> list[HistoricalQuery]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT query_id, analyst_id, session_id, text, generated_query, timestamp, result_count, was_successful "
            "FROM query_history WHERE analyst_id = ? ORDER BY timestamp DESC LIMIT ?",
            (analyst_id, limit),
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        HistoricalQuery(
            query_id=r[0],
            analyst_id=r[1],
            session_id=r[2],
            text=r[3],
            generated_query=r[4],
            timestamp=_parse_utc(r[5]),
            result_count=r[6],
            was_successful=bool(r[7]),
        )
        for r in rows
    ]


async def get_autocomplete_suggestions(
    analyst_id: str, prefix: str, limit: int = 5
) -> list[HistoricalQuery]:
    if len(prefix) < 3:
        return []
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT query_id, analyst_id, session_id, text, generated_query, timestamp, result_count, was_successful "
            "FROM query_history WHERE analyst_id = ? AND text LIKE ? ORDER BY timestamp DESC LIMIT ?",
            (analyst_id, f"{prefix}%", limit),
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        HistoricalQuery(
            query_id=r[0],
            analyst_id=r[1],
            session_id=r[2],
            text=r[3],
            generated_query=r[4],
            timestamp=_parse_utc(r[5]),
            result_count=r[6],
            was_successful=bool(r[7]),
        )
        for r in rows
    ]


async def get_team_pool(limit: int = 10) -> list[TeamPoolEntry]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT pool_id, anonymized_text, use_count, last_used, category "
            "FROM team_pool ORDER BY use_count DESC LIMIT ?",
            (limit,),
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        TeamPoolEntry(
            pool_id=r[0],
            anonymized_text=r[1],
            use_count=r[2],
            last_used=_parse_utc(r[3]),
            category=r[4],
        )
        for r in rows
    ]


async def save_to_team_pool(text: str, category: str = "general") -> None:
    from src.llm.pii_scrubber import scrub
    anonymized = scrub(text)
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if similar entry exists
        async with db.execute(
            "SELECT pool_id, use_count FROM team_pool WHERE anonymized_text = ?",
            (anonymized,),
        ) as cursor:
            existing = await cursor.fetchone()
        if existing:
            await db.execute(
                "UPDATE team_pool SET use_count = ?, last_used = ? WHERE pool_id = ?",
                (existing[1] + 1, datetime.now(timezone.utc).isoformat(), existing[0]),
            )
        else:
            entry = TeamPoolEntry(anonymized_text=anonymized, category=category)
            await db.execute(
                "INSERT INTO team_pool (pool_id, anonymized_text, use_count, last_used, category) VALUES (?,?,?,?,?)",
                (entry.pool_id, entry.anonymized_text, entry.use_count, entry.last_used.isoformat(), entry.category),
            )
        await db.commit()
