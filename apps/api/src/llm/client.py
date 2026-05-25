import os
import anthropic
from typing import AsyncIterator
from config import settings
from src.llm.pii_scrubber import scrub_messages

_client: anthropic.AsyncAnthropic | None = None
_use_mock: bool | None = None


def _is_mock() -> bool:
    global _use_mock
    if _use_mock is None:
        _use_mock = settings.mock_llm
    return _use_mock


def set_mock(value: bool) -> None:
    global _use_mock
    _use_mock = value


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def complete(
    messages: list[dict],
    system: str,
    model: str,
    max_tokens: int = 1024,
    use_cache: bool = True,
) -> str:
    if _is_mock():
        from src.llm.mock_client import complete_mock
        return await complete_mock(messages, system, model, max_tokens)

    client = get_client()
    safe_messages = scrub_messages(messages)

    system_blocks: list[dict] = [{"type": "text", "text": system}]
    if use_cache:
        system_blocks[0]["cache_control"] = {"type": "ephemeral"}

    try:
        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_blocks,
            messages=safe_messages,
        )
        return response.content[0].text
    except anthropic.BadRequestError as e:
        if "credit balance" in str(e).lower() or "billing" in str(e).lower():
            set_mock(True)
            from src.llm.mock_client import complete_mock
            return await complete_mock(messages, system, model, max_tokens)
        raise


async def stream(
    messages: list[dict],
    system: str,
    model: str,
    max_tokens: int = 2048,
) -> AsyncIterator[str]:
    if _is_mock():
        from src.llm.mock_client import stream_mock
        async for chunk in stream_mock(messages, system, model, max_tokens):
            yield chunk
        return

    client = get_client()
    safe_messages = scrub_messages(messages)

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=[{"type": "text", "text": system}],
            messages=safe_messages,
        ) as stream_obj:
            async for text in stream_obj.text_stream:
                yield text
    except anthropic.BadRequestError as e:
        if "credit balance" in str(e).lower() or "billing" in str(e).lower():
            set_mock(True)
            from src.llm.mock_client import stream_mock
            async for chunk in stream_mock(messages, system, model, max_tokens):
                yield chunk
        else:
            raise
