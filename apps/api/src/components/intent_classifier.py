import json
import re
from config import settings
from src.llm import client as llm
from src.llm.prompts import classifier as classifier_prompt
from src.models.requests import ClassifyResponse, DisambiguationChip

_DISAMBIGUATION_EXAMPLES = {
    "query": "Search logs for this pattern",
    "action": "Take action on what's on screen",
    "refine": "Refine or continue my current query",
}


async def classify(text: str, session_summary: str | None = None) -> ClassifyResponse:
    messages = classifier_prompt.build_messages(text, session_summary)

    raw = await llm.complete(
        messages=messages,
        system=classifier_prompt.SYSTEM,
        model=settings.classifier_model,
        max_tokens=256,
        use_cache=True,
    )

    parsed = _parse_response(raw)

    chips: list[DisambiguationChip] = []
    if parsed["confidence"] < 0.6:
        chips = _build_disambiguation_chips(parsed["mode"])

    return ClassifyResponse(
        mode=parsed["mode"],
        intent_label=parsed["intent_label"],
        confidence=parsed["confidence"],
        extracted_entities=parsed["extracted_entities"],
        disambiguation_chips=chips,
    )


def _parse_response(raw: str) -> dict:
    try:
        # Strip markdown fences if present
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        data = json.loads(cleaned)
        return {
            "mode": data.get("mode", "query"),
            "intent_label": data.get("intent_label", "unknown"),
            "confidence": float(data.get("confidence", 0.5)),
            "extracted_entities": data.get("extracted_entities", []),
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "mode": "query",
            "intent_label": "parse_error",
            "confidence": 0.3,
            "extracted_entities": [],
        }


def _build_disambiguation_chips(detected_mode: str) -> list[DisambiguationChip]:
    modes = ["query", "action", "refine"]
    top_two = [detected_mode] + [m for m in modes if m != detected_mode][:1]
    return [
        DisambiguationChip(label=_DISAMBIGUATION_EXAMPLES[m], mode=m)
        for m in top_two
    ] + [DisambiguationChip(label="Something else — let me rephrase", mode=detected_mode)]
