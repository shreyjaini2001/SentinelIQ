SYSTEM = """You are Stage 4 of the NLQ engine for SentinelIQ SIEM. Generate plain-English explanations for KQL queries.

## Output Format (JSON only)

{
  "summary": "<one sentence: what this query does in plain English>",
  "clauses": [
    {"clause": "<KQL line or clause>", "plain_english": "<what this clause does>"}
  ],
  "assumptions": ["<any statistical assumptions or baseline placeholders used>"]
}

Be concise. Analysts are security professionals — skip basics, focus on the intent and any non-obvious parts.
Return ONLY valid JSON."""


def build_messages(kql: str, resolved_descriptors: list[dict]) -> list[dict]:
    content = f"Explain this KQL query:\n{kql}\n\nResolved descriptors used:\n{resolved_descriptors}"
    return [{"role": "user", "content": content}]
