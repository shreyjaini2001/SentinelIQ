"""
Provider factory — returns the correct LLM and data provider based on config.
Swap implementations here when moving from mock/fixture mode to production.
"""
import os
from src.providers.llm.base import LLMProvider
from src.providers.data.base import DataProvider


def get_llm_provider() -> LLMProvider:
    if os.getenv("MOCK_LLM", "false").lower() == "true":
        from src.providers.llm.mock_provider import MockLLMProvider
        return MockLLMProvider()
    from src.providers.llm.anthropic_provider import AnthropicLLMProvider
    return AnthropicLLMProvider()


def get_data_provider() -> DataProvider:
    if os.getenv("MOCK_LLM", "false").lower() == "true":
        from src.providers.data.fixture_provider import FixtureDataProvider
        return FixtureDataProvider()
    from src.providers.data.siem_provider import RealSIEMProvider
    return RealSIEMProvider()
