import re

_PATTERNS = [
    (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", "[EMAIL]"),
    (r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b", "[SSN]"),
    (r"\b(?:\d[ -]?){13,16}\b", "[CARD]"),
    (r"\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "[PHONE]"),
    (r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", "[IP]"),
]

_COMPILED = [(re.compile(p), r) for p, r in _PATTERNS]


def scrub(text: str) -> str:
    for pattern, replacement in _COMPILED:
        text = pattern.sub(replacement, text)
    return text


def scrub_messages(messages: list[dict]) -> list[dict]:
    scrubbed = []
    for msg in messages:
        if isinstance(msg.get("content"), str):
            scrubbed.append({**msg, "content": scrub(msg["content"])})
        elif isinstance(msg.get("content"), list):
            new_content = []
            for block in msg["content"]:
                if isinstance(block, dict) and block.get("type") == "text":
                    new_content.append({**block, "text": scrub(block["text"])})
                else:
                    new_content.append(block)
            scrubbed.append({**msg, "content": new_content})
        else:
            scrubbed.append(msg)
    return scrubbed
