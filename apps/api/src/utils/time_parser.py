import re
from datetime import datetime, timedelta, timezone


_RELATIVE_PATTERNS = [
    (r"last (\d+) hours?", lambda m: timedelta(hours=int(m.group(1)))),
    (r"last (\d+) days?", lambda m: timedelta(days=int(m.group(1)))),
    (r"last (\d+) weeks?", lambda m: timedelta(weeks=int(m.group(1)))),
    (r"last (\d+) minutes?", lambda m: timedelta(minutes=int(m.group(1)))),
    (r"past (\d+) hours?", lambda m: timedelta(hours=int(m.group(1)))),
    (r"past (\d+) days?", lambda m: timedelta(days=int(m.group(1)))),
    (r"today", lambda m: timedelta(hours=datetime.now(timezone.utc).hour)),
    (r"yesterday", lambda m: timedelta(days=1)),
    (r"this week", lambda m: timedelta(days=datetime.now(timezone.utc).weekday())),
    (r"last week", lambda m: timedelta(weeks=1)),
    (r"this month", lambda m: timedelta(days=datetime.now(timezone.utc).day - 1)),
]

_COMPILED = [(re.compile(p, re.IGNORECASE), fn) for p, fn in _RELATIVE_PATTERNS]


def parse_time_range(text: str) -> tuple[datetime, datetime] | None:
    now = datetime.now(timezone.utc)
    for pattern, delta_fn in _COMPILED:
        m = pattern.search(text)
        if m:
            delta = delta_fn(m)
            return (now - delta, now)
    return None


def to_kql_time(dt: datetime) -> str:
    return dt.strftime("datetime(%Y-%m-%dT%H:%M:%SZ)")


def extract_time_filter_kql(text: str) -> str | None:
    result = parse_time_range(text)
    if result:
        start, end = result
        return f"TimeGenerated between ({to_kql_time(start)} .. {to_kql_time(end)})"
    return "TimeGenerated > ago(24h)"
