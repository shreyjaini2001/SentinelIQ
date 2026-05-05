import json
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from src.models.session import SessionContext
from src.storage.db import DB_PATH
from config import settings
import aiosqlite


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _expires_at() -> datetime:
    return _now() + timedelta(hours=settings.session_ttl_hours)


async def create_session(analyst_id: str = "default") -> SessionContext:
    ctx = SessionContext(
        session_id=str(uuid.uuid4()),
        analyst_id=analyst_id,
        started_at=_now(),
        expires_at=_expires_at(),
    )
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sessions (session_id, analyst_id, context_json, started_at, expires_at) VALUES (?,?,?,?,?)",
            (
                ctx.session_id,
                ctx.analyst_id,
                ctx.model_dump_json(),
                ctx.started_at.isoformat(),
                ctx.expires_at.isoformat(),
            ),
        )
        await db.commit()
    return ctx


async def get_session(session_id: str) -> SessionContext | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT context_json, expires_at FROM sessions WHERE session_id = ?",
            (session_id,),
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            context_json, expires_at_str = row
            expires_at = datetime.fromisoformat(expires_at_str)
            if _now() > expires_at:
                await db.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
                await db.commit()
                return None
            return SessionContext.model_validate_json(context_json)


async def update_session(ctx: SessionContext) -> None:
    ctx.last_updated = _now()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET context_json = ? WHERE session_id = ?",
            (ctx.model_dump_json(), ctx.session_id),
        )
        await db.commit()


async def create_share_token(session_id: str, base_url: str) -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    expires_at = (_now() + timedelta(hours=settings.session_ttl_hours)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET share_token = ? WHERE session_id = ?",
            (token, session_id),
        )
        await db.commit()
    share_url = f"{base_url}/session/shared/{token}"
    return token, share_url


async def get_session_by_token(token: str) -> SessionContext | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT context_json FROM sessions WHERE share_token = ?",
            (token,),
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return SessionContext.model_validate_json(row[0])
