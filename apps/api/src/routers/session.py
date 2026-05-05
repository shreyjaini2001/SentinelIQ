from fastapi import APIRouter, HTTPException, Request
from src.models.requests import ShareSessionResponse
from src.storage import session_store
from src.components import session_manager

router = APIRouter()


@router.post("/session")
async def create_session(analyst_id: str = "default"):
    ctx = await session_manager.get_or_create(None, analyst_id)
    return {"session_id": ctx.session_id, "analyst_id": ctx.analyst_id, "expires_at": ctx.expires_at.isoformat()}


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    ctx = await session_store.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return ctx.model_dump()


@router.post("/session/{session_id}/share", response_model=ShareSessionResponse)
async def share_session(session_id: str, request: Request):
    ctx = await session_store.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")
    base_url = str(request.base_url).rstrip("/")
    token, share_url = await session_store.create_share_token(session_id, base_url)
    return ShareSessionResponse(
        share_token=token,
        share_url=share_url,
        expires_at=ctx.expires_at.isoformat(),
    )


@router.get("/session/shared/{token}")
async def get_shared_session(token: str):
    ctx = await session_store.get_session_by_token(token)
    if not ctx:
        raise HTTPException(status_code=404, detail="Shared session not found or expired")
    return ctx.model_dump()


@router.post("/session/{session_id}/note")
async def add_note(session_id: str, note: str):
    ctx = await session_store.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Session not found")
    ctx.analyst_notes.append(note)
    await session_store.update_session(ctx)
    return {"ok": True}
