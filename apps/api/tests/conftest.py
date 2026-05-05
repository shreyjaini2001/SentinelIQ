"""
Shared pytest fixtures for SentinelIQ API tests.
All tests run against the FastAPI app in-process with MOCK_LLM=true.
No network calls, no API credits, no external dependencies.
"""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Force mock mode before anything imports config or llm client
os.environ.setdefault("MOCK_LLM", "true")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-test-placeholder")

from main import app  # noqa: E402 — must come after env setup


@pytest_asyncio.fixture
async def client():
    """AsyncClient wired directly to the FastAPI ASGI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def session_id(client):
    """Returns a valid session_id created via the API — synchronous wrapper."""
    import asyncio
    async def _create():
        resp = await client.post("/api/v1/session?analyst_id=test_analyst")
        assert resp.status_code == 200
        return resp.json()["session_id"]
    return asyncio.get_event_loop().run_until_complete(_create())
