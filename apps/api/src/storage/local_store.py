"""
Local demo persistence store (v1.2.0).

A deliberately simple, document-style SQLite store (Python stdlib `sqlite3`) that backs the
frontend's serialized domain state — investigation memory, alert lifecycle/audit trail, and
workspace checkpoints. It is NOT a normalized production database and NOT secured for
multi-tenant use; it is a local demo persistence foundation with a clean boundary so a real
database can replace it later without changing the frontend contract.

Design:
- One `state_documents` table keyed by (namespace, key) holding a JSON payload + schema version.
- One `app_metadata` table for small key/value bookkeeping (e.g. last save time).
- A single process-wide connection guarded by a lock (SQLite + FastAPI threadpool safe).
- Lazily initialized on first use, so it works whether or not the ASGI lifespan ran.
"""
from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import settings

SCHEMA_VERSION = 1

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db_path() -> str:
    return settings.sentineliq_db_path


def _connect() -> sqlite3.Connection:
    """Return the process-wide connection, creating + initializing it on first use."""
    global _conn
    if _conn is None:
        path = _db_path()
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _init(_conn)
    return _conn


def _init(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS state_documents (
            namespace       TEXT    NOT NULL,
            key             TEXT    NOT NULL,
            schema_version  INTEGER NOT NULL,
            payload_json    TEXT    NOT NULL,
            created_at      TEXT    NOT NULL,
            updated_at      TEXT    NOT NULL,
            PRIMARY KEY (namespace, key)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS app_metadata (
            key         TEXT PRIMARY KEY,
            value       TEXT,
            updated_at  TEXT
        )
        """
    )
    conn.commit()


def init_local_store() -> None:
    """Eagerly initialize (called from app lifespan; safe to call more than once)."""
    with _lock:
        _connect()


def put_document(namespace: str, key: str, payload: Any, schema_version: int = SCHEMA_VERSION) -> None:
    with _lock:
        conn = _connect()
        now = _now()
        conn.execute(
            """
            INSERT INTO state_documents (namespace, key, schema_version, payload_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(namespace, key) DO UPDATE SET
                schema_version = excluded.schema_version,
                payload_json   = excluded.payload_json,
                updated_at     = excluded.updated_at
            """,
            (namespace, key, schema_version, json.dumps(payload), now, now),
        )
        conn.commit()


def get_document(namespace: str, key: str) -> dict[str, Any] | None:
    with _lock:
        conn = _connect()
        row = conn.execute(
            "SELECT payload_json, schema_version, updated_at FROM state_documents WHERE namespace = ? AND key = ?",
            (namespace, key),
        ).fetchone()
    if row is None:
        return None
    return {
        "payload": json.loads(row["payload_json"]),
        "schema_version": row["schema_version"],
        "updated_at": row["updated_at"],
    }


def get_all_documents() -> list[dict[str, Any]]:
    with _lock:
        conn = _connect()
        rows = conn.execute(
            "SELECT namespace, key, payload_json, schema_version, updated_at FROM state_documents"
        ).fetchall()
    return [
        {
            "namespace": r["namespace"],
            "key": r["key"],
            "schema_version": r["schema_version"],
            "payload": json.loads(r["payload_json"]),
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def clear_all() -> None:
    """Reset demo persistence: drop every stored document + metadata."""
    with _lock:
        conn = _connect()
        conn.execute("DELETE FROM state_documents")
        conn.execute("DELETE FROM app_metadata")
        conn.commit()


def set_metadata(key: str, value: str) -> None:
    with _lock:
        conn = _connect()
        conn.execute(
            """
            INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, value, _now()),
        )
        conn.commit()


def get_metadata(key: str) -> str | None:
    with _lock:
        conn = _connect()
        row = conn.execute("SELECT value FROM app_metadata WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def stats() -> dict[str, Any]:
    with _lock:
        conn = _connect()
        count = conn.execute("SELECT COUNT(*) AS c FROM state_documents").fetchone()["c"]
        last = conn.execute("SELECT MAX(updated_at) AS m FROM state_documents").fetchone()["m"]
    return {
        "dbPath": _db_path(),
        "schemaVersion": SCHEMA_VERSION,
        "documentCount": count,
        "lastUpdated": last,
    }
