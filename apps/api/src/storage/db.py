import aiosqlite
import json
from pathlib import Path
from config import settings

DB_PATH = settings.session_db_path

CREATE_SESSIONS_TABLE = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    analyst_id TEXT NOT NULL,
    context_json TEXT NOT NULL,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    share_token TEXT
);
"""

CREATE_QUERY_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS query_history (
    query_id TEXT PRIMARY KEY,
    analyst_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    text TEXT NOT NULL,
    generated_query TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    result_count INTEGER,
    was_successful INTEGER DEFAULT 0
);
"""

CREATE_TEMPLATES_TABLE = """
CREATE TABLE IF NOT EXISTS query_templates (
    template_id TEXT PRIMARY KEY,
    analyst_id TEXT NOT NULL,
    name TEXT NOT NULL,
    query_text TEXT NOT NULL,
    parameters_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    use_count INTEGER DEFAULT 0
);
"""

CREATE_TEAM_POOL_TABLE = """
CREATE TABLE IF NOT EXISTS team_pool (
    pool_id TEXT PRIMARY KEY,
    anonymized_text TEXT NOT NULL,
    use_count INTEGER DEFAULT 1,
    last_used TEXT NOT NULL,
    category TEXT DEFAULT 'general'
);
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_SESSIONS_TABLE)
        await db.execute(CREATE_QUERY_HISTORY_TABLE)
        await db.execute(CREATE_TEMPLATES_TABLE)
        await db.execute(CREATE_TEAM_POOL_TABLE)
        await db.commit()


async def get_db():
    return aiosqlite.connect(DB_PATH)
