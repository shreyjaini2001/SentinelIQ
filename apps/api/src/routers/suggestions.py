from fastapi import APIRouter, HTTPException
from src.models.requests import SuggestionsResponse, AutocompleteResponse
from src.components import suggestion_engine, session_manager
from src.storage import session_store

router = APIRouter()


@router.get("/suggestions", response_model=SuggestionsResponse)
async def get_suggestions(session_id: str):
    ctx = await session_store.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")
    return await suggestion_engine.get_suggestions(ctx)


@router.get("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(q: str, session_id: str | None = None, limit: int = 5):
    analyst_id = "default"
    if session_id:
        ctx = await session_store.get_session(session_id)
        if ctx:
            analyst_id = ctx.analyst_id
    return await suggestion_engine.get_autocomplete(analyst_id, q, session_id)
