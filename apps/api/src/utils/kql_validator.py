import re

_VALID_OPERATORS = {"==", "!=", ">", "<", ">=", "<=", "=~", "!~", "has", "contains", "in", "!in", "between", "startswith", "endswith"}
_REQUIRED_TABLES = {
    "SigninLogs", "SecurityEvent", "CommonSecurityLog", "Syslog",
    "DeviceProcessEvents", "DeviceNetworkEvents", "AuditLogs",
    "OfficeActivity", "AzureActivity", "BehaviorAnalytics",
}


def validate_kql(query: str) -> tuple[bool, list[str]]:
    errors = []

    if not query or not query.strip():
        return False, ["Empty query"]

    # Check brackets are balanced
    for open_b, close_b in [("(", ")"), ("[", "]")]:
        if query.count(open_b) != query.count(close_b):
            errors.append(f"Unbalanced brackets: {open_b}{close_b}")

    # Check for a table name at the start (KQL always starts with a table)
    first_token = query.strip().split()[0] if query.strip() else ""
    if first_token not in _REQUIRED_TABLES and not first_token.startswith("//"):
        # Allow union, let, etc.
        allowed_starts = {"union", "let", "//", "print", "range", "search"}
        if first_token.lower() not in allowed_starts:
            errors.append(f"Query should start with a known table name or keyword, got: '{first_token}'")

    # Check for time filter (required per PRD)
    has_time_filter = bool(
        re.search(r"TimeGenerated", query, re.IGNORECASE) or
        re.search(r"ago\(", query, re.IGNORECASE) or
        re.search(r"between\s*\(", query, re.IGNORECASE)
    )
    if not has_time_filter:
        errors.append("Query missing time filter (TimeGenerated or ago())")

    return len(errors) == 0, errors


def sanitize_kql(query: str) -> str:
    # Strip any markdown fences if LLM included them
    query = re.sub(r"```(?:kql|kusto)?\n?", "", query)
    query = re.sub(r"```\n?", "", query)
    return query.strip()
