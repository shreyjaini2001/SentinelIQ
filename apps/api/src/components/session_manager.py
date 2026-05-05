from datetime import datetime, timezone
from src.models.session import SessionContext, QueryEntry, Entity
from src.storage import session_store
from src.llm import client as llm
from config import settings

_COMPRESS_EVERY_N_TURNS = 5

_COMPRESS_SYSTEM = """You are summarizing an analyst's SIEM investigation session.
Produce a concise 2-3 sentence summary preserving: key entities investigated, findings, and current focus.
Output plain text only."""


async def get_or_create(session_id: str | None, analyst_id: str = "default") -> SessionContext:
    if session_id:
        ctx = await session_store.get_session(session_id)
        if ctx:
            return ctx
    return await session_store.create_session(analyst_id)


async def record_query(
    ctx: SessionContext,
    entry: QueryEntry,
) -> SessionContext:
    ctx.query_history.append(entry)
    if len(ctx.query_history) > 20:
        ctx.query_history = ctx.query_history[-20:]

    # Update active entities
    for entity in entry.extracted_entities:
        existing = next((e for e in ctx.active_entities if e.value == entity.value), None)
        if existing:
            existing.frequency += 1
        else:
            ctx.active_entities.append(entity)

    ctx.turn_count += 1

    if ctx.turn_count % _COMPRESS_EVERY_N_TURNS == 0:
        await _compress_context(ctx)

    await session_store.update_session(ctx)
    return ctx


async def _compress_context(ctx: SessionContext) -> None:
    if not ctx.query_history:
        return
    history_text = "\n".join(
        f"- [{e.timestamp.strftime('%H:%M')}] {e.original_text} → {e.generated_query[:80]}"
        for e in ctx.query_history[:-5]  # summarize all but last 5
    )
    summary = await llm.complete(
        messages=[{"role": "user", "content": f"Summarize this investigation:\n{history_text}"}],
        system=_COMPRESS_SYSTEM,
        model=settings.classifier_model,
        max_tokens=200,
        use_cache=False,
    )
    ctx.compressed_summary = summary


def build_session_summary(ctx: SessionContext) -> str:
    parts = []
    if ctx.compressed_summary:
        parts.append(f"Prior context: {ctx.compressed_summary}")
    if ctx.active_entities:
        entities_str = ", ".join(f"{e.type}:{e.value}" for e in ctx.active_entities[:5])
        parts.append(f"Active entities: {entities_str}")
    if ctx.query_history:
        last = ctx.query_history[-1]
        parts.append(f"Last query: {last.original_text}")
    if ctx.active_investigation:
        parts.append(f"Active incident: {ctx.active_investigation}")
    return " | ".join(parts) if parts else ""


def get_prior_query(ctx: SessionContext) -> str | None:
    if ctx.query_history:
        return ctx.query_history[-1].generated_query
    return None
