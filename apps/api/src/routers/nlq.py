import uuid
from fastapi import APIRouter, HTTPException
from src.models.requests import QueryRequest, QueryResponse
from src.models.session import QueryEntry, Entity
from src.components import nlq_engine, session_manager
from src.storage import query_store
from src.models.query_memory import HistoricalQuery

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def process_query(req: QueryRequest) -> QueryResponse:
    if not req.session_id or not req.session_id.strip():
        raise HTTPException(status_code=400, detail="session_id is required")
    ctx = await session_manager.get_or_create(req.session_id)
    prior_query = session_manager.get_prior_query(ctx) if req.mode == "refine" else None

    result = await nlq_engine.process_query(
        text=req.text,
        mode=req.mode,
        prior_query=prior_query,
        target_language=req.target_language,
    )

    # Record in session
    entry = QueryEntry(
        query_id=result.query_id,
        original_text=req.text,
        generated_query=result.generated_query,
        confidence=result.confidence,
        mode=req.mode,
        extracted_entities=[
            Entity(type=e.type, value=e.value)
            for e in result.extracted_entities
        ],
    )
    await session_manager.record_query(ctx, entry)

    # Save to query history for autocomplete
    await query_store.save_query(
        HistoricalQuery(
            query_id=result.query_id,
            analyst_id=ctx.analyst_id,
            session_id=ctx.session_id,
            text=req.text,
            generated_query=result.generated_query,
            was_successful=result.confidence >= 60,
        )
    )

    # Save successful queries to team pool
    if result.confidence >= 70:
        await query_store.save_to_team_pool(req.text)

    return result
