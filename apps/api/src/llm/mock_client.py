"""
Mock LLM responses for development without API credits.
Activated when MOCK_LLM=true in .env or when API returns billing errors.
Uses keyword-based heuristics to produce realistic-looking outputs.
"""

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncIterator


def _score_alert_mock(text: str) -> dict:
    text_lower = text.lower()
    import re as _re
    alert_id_match = _re.search(r"alert id:\s*([a-f0-9\-]+)", text_lower)
    alert_id = alert_id_match.group(1) if alert_id_match else "unknown"

    # Determine TP/FP based on log content signals (use field-level checks, not bare substrings)
    tp = 50
    fp = 50
    confidence = "medium"
    reasoning = "Mixed signals — manual review recommended."
    fields = []

    has_geo_anomaly = ('"ru"' in text_lower or '"cn"' in text_lower or '"ir"' in text_lower
                       or "countryorregion" in text_lower and ("unusual" in text_lower or "geo" in text_lower))
    has_malicious_process = ("powershell.exe -enc" in text_lower or "mimikatz" in text_lower
                             or "lsass" in text_lower and "memory" in text_lower or "sekurlsa" in text_lower)
    has_service_account = ("svc-" in text_lower or "service account" in text_lower)
    has_brute_force = ("failedattempts" in text_lower or "brute" in text_lower or "multiple failed" in text_lower)
    has_admin_creation = ("4720" in text_lower or ("targetusername" in text_lower and "4726" in text_lower)
                          or ("new" in text_lower and "admin" in text_lower and "created" in text_lower))

    if has_malicious_process:
        tp, fp = 85, 15
        confidence = "high"
        reasoning = "Encoded PowerShell or credential-dumping tool indicators are highly reliable TP signals. Very few legitimate processes use these techniques."
        fields = ["ProcessCommandLine", "FileName", "InitiatingProcessFileName"]
    elif has_admin_creation:
        tp, fp = 90, 10
        confidence = "high"
        reasoning = "New local admin account creation on a domain controller is almost always a TP unless explicitly authorized. This requires immediate verification with the account owner."
        fields = ["EventID", "TargetUserName", "SubjectUserName", "Computer"]
    elif has_geo_anomaly:
        tp, fp = 78, 22
        confidence = "high"
        reasoning = "Login from a country not in the org's geo baseline. Combined with failed authentication events, this strongly suggests an unauthorized access attempt."
        fields = ["CountryOrRegion", "ResultType", "IPAddress"]
    elif has_service_account:
        tp, fp = 35, 65
        confidence = "medium"
        reasoning = "Service account activity outside business hours is suspicious but may reflect legitimate scheduled jobs. Verify the backup schedule and known maintenance windows."
        fields = ["UserPrincipalName", "LogonType", "TimeGenerated", "WorkstationName"]
    elif has_brute_force:
        tp, fp = 55, 45
        confidence = "medium"
        reasoning = "Brute force pattern detected but the source IP is in the US and the target account is 'admin' — could be scanner noise. Check if this IP is known-good."
        fields = ["IpAddress", "FailedAttempts", "TargetUserName", "Location"]

    return {
        "alert_id": alert_id,
        "fp_probability": fp,
        "tp_probability": tp,
        "confidence": confidence,
        "reasoning": reasoning,
        "influencing_fields": fields,
    }


def _hunt_narrative_mock(text: str) -> str:
    text_lower = text.lower()
    confirmed = text_lower.count("confirmed")
    suspected = text_lower.count("suspected")
    not_found = text_lower.count("not_found")

    if "lapsus" in text_lower:
        actor = "LAPSUS$"
    elif "scattered spider" in text_lower:
        actor = "Scattered Spider"
    else:
        actor = "the specified threat actor"

    return (
        f"The threat hunt for {actor} TTPs returned {confirmed + suspected} technique{'s' if confirmed + suspected != 1 else ''} with observable evidence out of {confirmed + suspected + not_found} queried. "
        f"{'Confirmed evidence was found for credential access and lateral movement techniques, which represents a high-confidence finding requiring immediate escalation. ' if confirmed > 1 else 'Evidence quality is moderate, suggesting early-stage activity or incomplete log coverage for these techniques. '}"
        f"Notably, {not_found} technique{'s showed' if not_found != 1 else ' showed'} no evidence, which may indicate the threat actor is not yet present in your environment or is operating under detection thresholds for those specific techniques. "
        f"The recommended next step is to pivot on the entities found in the credential access findings and run a timeline reconstruction to understand the full scope of activity. "
        f"Additionally, review and enable logging for the techniques with no evidence to reduce detection blind spots before the next hunt cycle."
    )


def _stage_annotation_mock(text: str) -> str:
    text_lower = text.lower()
    tactic_match = None
    for tactic in ["execution", "privilege escalation", "lateral movement", "credential access",
                   "discovery", "exfiltration", "persistence", "initial access", "defense evasion",
                   "collection", "command and control", "impact"]:
        if tactic in text_lower:
            tactic_match = tactic
            break

    annotations = {
        "execution": "PowerShell with encoded commands spawned from unexpected parent process.",
        "privilege escalation": "Special privileges were assigned to the active session immediately after login.",
        "lateral movement": "Account authenticated to 4 additional systems via network logon within 30 minutes.",
        "credential access": "LSASS memory accessed by non-system process — likely credential dumping attempt.",
        "discovery": "Rapid enumeration of domain users, groups, and network topology via built-in commands.",
        "exfiltration": "Large outbound data transfer to public IP on non-standard port.",
        "persistence": "Scheduled task created to maintain persistence after session termination.",
        "initial access": "Successful login from geolocation not previously seen for this account.",
        "defense evasion": "Logging service tampered with and shadow copies deleted before encryption.",
        "collection": "Files staged in temp directory prior to compression and transfer.",
        "command and control": "Periodic outbound HTTP beacon to known C2 infrastructure.",
        "impact": "Mass file modification with encryption extensions — ransomware indicators present.",
    }
    return annotations.get(tactic_match, "Suspicious activity observed — manual review recommended.")


def _parse_semantic(text: str) -> dict:
    text_lower = text.lower()
    qualitative = []
    for word in ["unusual", "abnormal", "rare", "high volume", "first time", "suspicious"]:
        if word in text_lower:
            qualitative.append(word)
    behaviors = []
    for b in ["failed login", "authentication", "outbound", "connection", "process", "file write", "lateral movement", "privilege escalation"]:
        if b in text_lower:
            behaviors.append(b)
    if "6 hours" in text_lower or "6h" in text_lower:
        time_rel = "last 6 hours"
    elif "24 hours" in text_lower or "today" in text_lower:
        time_rel = "last 24 hours"
    elif "week" in text_lower:
        time_rel = "last 7 days"
    else:
        time_rel = "last 24 hours"
    return {
        "time_range": {"raw": None, "relative": time_rel, "is_relative": True},
        "entities": [],
        "behaviors": behaviors or ["event"],
        "qualitative_descriptors": qualitative,
        "data_sources": ["security logs"],
        "aggregation": "count" if "count" in text_lower or "how many" in text_lower else "list",
    }


def _build_kql_from_intent(text: str) -> dict:
    """Build KQL when the input is parsed intent (from stage 3 context)."""
    text_lower = text.lower()
    # Look for clues in the behaviors/entities sections of the parsed intent
    if "failed login" in text_lower or "signinlogs" in text_lower or "authentication" in text_lower:
        kql = """SigninLogs
| where TimeGenerated > ago(6h)
| where ResultType != 0
| where CountryOrRegion !in (dynamic(["US", "CA", "GB"]))
| summarize FailedAttempts = count(), Countries = make_set(CountryOrRegion), IPs = make_set(IPAddress) by UserPrincipalName
| where FailedAttempts > 5
| order by FailedAttempts desc"""
        return {"kql": kql, "table": "SigninLogs"}
    elif "lateral" in text_lower:
        kql = """SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID in (4624, 4648)
| where LogonType in (3, 10)
| summarize Targets = dcount(Computer), TargetList = make_set(Computer) by Account, IpAddress
| where Targets > 3
| order by Targets desc"""
        return {"kql": kql, "table": "SecurityEvent"}
    elif "network" in text_lower or "outbound" in text_lower or "connection" in text_lower:
        kql = """DeviceNetworkEvents
| where TimeGenerated > ago(24h)
| where ActionType == "ConnectionSuccess"
| where RemoteIPType == "Public"
| where RemotePort !in (80, 443, 53, 123)
| summarize Connections = count(), Bytes = sum(AdditionalFields.BytesSent) by DeviceName
| order by Bytes desc"""
        return {"kql": kql, "table": "DeviceNetworkEvents"}
    else:
        kql = """SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID in (4624, 4625, 4648)
| project TimeGenerated, Computer, Account, Activity, EventID
| order by TimeGenerated desc
| limit 100"""
        return {"kql": kql, "table": "SecurityEvent"}


def _explain_kql(kql_text: str) -> dict:
    """Generate explanation for a given KQL block."""
    kql_lower = kql_text.lower()
    clauses = []

    lines = [l.strip() for l in kql_text.split('\n') if l.strip() and not l.strip().startswith('//')]
    table_line = lines[0] if lines else "SecurityEvent"

    _TABLE_NAMES = {
        "signinlogs": "Azure AD sign-in log table",
        "securityevent": "Windows Security Event Log table",
        "devicenetworkevents": "Defender for Endpoint network events table",
        "deviceprocessevents": "Defender for Endpoint process events table",
        "commonsecuritylog": "CEF/Syslog common security format table",
    }
    table_explain = _TABLE_NAMES.get(table_line.lower().strip('|').strip(), f"{table_line} log table")
    clauses.append({"clause": table_line, "plain_english": table_explain})

    for line in lines[1:]:
        line = line.lstrip('| ').strip()
        if not line:
            continue
        if "timegenerated" in line.lower():
            clauses.append({"clause": line, "plain_english": "Restrict results to the specified time window"})
        elif "resulttype" in line.lower():
            clauses.append({"clause": line, "plain_english": "Filter to failed sign-ins (non-zero result code = failure)"})
        elif "countryorregion" in line.lower():
            clauses.append({"clause": line, "plain_english": "Exclude logins from expected countries — adjust list to match org's geo baseline"})
        elif "summarize" in line.lower():
            clauses.append({"clause": line, "plain_english": "Aggregate results — count events and collect unique values per group"})
        elif "logontype" in line.lower():
            clauses.append({"clause": line, "plain_english": "Network (3) and remote interactive (10) logon types are the primary lateral movement vectors"})
        elif "eventid" in line.lower():
            clauses.append({"clause": line, "plain_english": "Filter to specific Windows security event IDs relevant to the investigation"})
        elif "where" in line.lower():
            clauses.append({"clause": line, "plain_english": f"Filter condition: {line}"})
        elif "order by" in line.lower():
            clauses.append({"clause": line, "plain_english": "Sort results by highest-impact items first"})
        elif "limit" in line.lower() or "top " in line.lower():
            clauses.append({"clause": line, "plain_english": "Cap result count to avoid overwhelming the analyst"})

    # Build a concise summary
    if "signinlogs" in kql_lower:
        summary = "Finds failed sign-in attempts from unusual geolocations, grouped by user to surface the highest-risk accounts."
        assumptions = ["Country exclusion list (US/CA/GB) is a placeholder — replace with your org's geo baseline", "FailedAttempts threshold of 5 is tunable per environment"]
    elif "lateral" in kql_lower or ("securityevent" in kql_lower and "logontype" in kql_lower):
        summary = "Identifies accounts authenticating to an unusual number of systems — a key lateral movement indicator."
        assumptions = ["Threshold of 3 distinct target systems is a starting point — tune to your org's norm"]
    elif "devicenetworkevents" in kql_lower:
        summary = "Surfaces devices with high-volume or unusual outbound network connections that may indicate C2 or data exfiltration."
        assumptions = ["10MB byte threshold and port exclusion list should be tuned per environment"]
    else:
        summary = "Queries security events matching the specified criteria and returns the most recent results."
        assumptions = []

    return {"summary": summary, "clauses": clauses[:8], "assumptions": assumptions}


def _detect_mode(text: str) -> dict:
    text_lower = text.lower().strip()

    # The message may be wrapped: "Classify this analyst input:\n\nInput: {user_text}"
    # Extract just the user text for intent-checking to avoid false primary-intent detection
    actual_lower = text_lower
    if "input: " in actual_lower:
        actual_lower = actual_lower.split("input: ", 1)[1].strip()

    # Refine signals — checked first (most context-dependent, safest signals)
    refine_phrases = {
        # Narrowing scope
        "narrow that", "narrow it", "narrow down to",
        "limit that", "limit it to",
        "focus on the", "focus only",
        "only the ones",
        # Time / window changes
        "change the time", "change the filter", "change the range", "change the window",
        "expand the window", "expand the time", "expand that",
        # Explicit result-context words
        "in that result", "from that result", "to the results", "from the results",
        "to those results", "from those results",
        "from that last", "that last result",
        "the previous query", "the previous result", "filter the previous",
        "the same thing but", "same results",
        "for the same host", "for the same",
        # Exclusions on existing results
        "filter out", "exclude the", "exclude known", "exclude anything",
        # Additions / augmentations
        "add a count", "add a column", "add a where", "add a percentage",
        "add a trend", "add geolocation", "add context to",
        "pull in the",
        "include parent",
        "now add", "now include",
        "now show me only", "now show only",
        "combine with", "add a join",
        # Transformations
        "bucket the", "bucket by",
        "sorted differently", "sort by that",
        "compare with",
        # Legacy originals
        "now filter", "add filter", "change to", "instead",
        "just the", "only show", "also include", "remove the",
        "what about", "show only", "add a filter", "limit to",
    }

    # Hybrid-query detector: "Show me X and also triage it" → primary intent is query
    _QUERY_STARTERS = (
        "show me", "find ", "search", "look for", "get me",
        "run a search", "fetch", "query ", "what happened",
        "pull up", "list ", "display ",
    )

    def _is_hybrid_query() -> bool:
        # Use actual_lower (user text without prompt wrapper) for primary-intent detection
        t = actual_lower
        if " and " not in t:
            return False
        primary = t[:t.index(" and ")].strip()
        return any(primary.startswith(s) for s in _QUERY_STARTERS)

    # Action signals — "write" and "document" narrowed to avoid matching "file writes" / "Office documents"
    action_phrases = {
        "summarize", "summary", "report",
        "document this", "document the",
        "create rule", "create a rule", "create an alert rule", "create an alert",
        "turn this into", "turn these", "turn those",
        "triage", "score", "blast radius", "handoff", "playbook",
        "runbook", "brief", "detection rule", "generate", "estimate",
        "explain why", "why does", "why is rule", "why is this rule",
        "help me tune", "coach", "create a detection", "create playbook", "create runbook",
        "at risk", "what's at risk", "what is at risk",
        "next shift",
        "access paths", "reachable from",
        "compromised account", "if this account is", "is compromised",
        "likely false positive", "likely false positives",
        "tune this rule", "tune the rule",
        "suppress false",
        "identify all systems",
        "write a rule", "write a report", "write a playbook", "write a detection", "write a summary",
        "blast radius", "scope of compromise", "impact if",
        "compare", "baseline", "deviation", "anomalous behavior", "behavioral analysis",
        "how does this compare", "peer comparison", "peer percentile", "is this normal",
        "is this unusual", "outlier", "how anomalous",
        "write a rule", "create a rule", "suggest a rule", "rule for this",
        "executive summary", "executive report", "technical report",
        "regulatory report", "compliance report", "breach notification",
        "generate report", "create report", "draft a report",
        "hunt for", "threat hunt", "threat hunting", "ttp hunt",
        "build a timeline", "timeline for", "reconstruct timeline", "timeline reconstruction",
    }

    # Priority: refine > action (with hybrid-query guard) > query
    if any(phrase in text_lower for phrase in refine_phrases):
        return {"mode": "refine", "intent_label": "query_refinement", "confidence": 0.88, "extracted_entities": []}

    if any(phrase in text_lower for phrase in action_phrases):
        if not _is_hybrid_query():
            return {"mode": "action", "intent_label": "action_request", "confidence": 0.92, "extracted_entities": []}

    # Extract entities
    entities = []
    ip_matches = re.findall(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', text)
    entities.extend(ip_matches)
    user_match = re.search(r'\b([a-z]+smith|jsmith|admin|root|user\d+)\b', text_lower)
    if user_match:
        entities.append(user_match.group(1))
    host_match = re.search(r'\b(host-\d+|server-\d+|dc\d+|workstation-\d+)\b', text_lower)
    if host_match:
        entities.append(host_match.group(1))

    label = "log_search"
    if "login" in text_lower or "auth" in text_lower:
        label = "auth_log_search"
    elif "network" in text_lower or "outbound" in text_lower or "connection" in text_lower:
        label = "network_log_search"
    elif "process" in text_lower or "execution" in text_lower:
        label = "process_log_search"
    elif "file" in text_lower:
        label = "file_log_search"
    elif "lateral" in text_lower:
        label = "lateral_movement_search"
    elif "privilege" in text_lower or "escalation" in text_lower:
        label = "privilege_escalation_search"

    return {"mode": "query", "intent_label": label, "confidence": 0.87, "extracted_entities": entities}


def _build_kql(text: str) -> dict:
    text_lower = text.lower()
    now = datetime.now(timezone.utc)

    # Determine time range
    if "6 hours" in text_lower or "6h" in text_lower:
        time_filter = "TimeGenerated > ago(6h)"
    elif "24 hours" in text_lower or "today" in text_lower:
        time_filter = "TimeGenerated > ago(24h)"
    elif "week" in text_lower or "7 days" in text_lower:
        time_filter = "TimeGenerated > ago(7d)"
    elif "3 days" in text_lower:
        time_filter = "TimeGenerated > ago(3d)"
    elif "hour" in text_lower:
        time_filter = "TimeGenerated > ago(1h)"
    else:
        time_filter = "TimeGenerated > ago(24h)"

    # Select appropriate query template
    if "failed login" in text_lower or "failed auth" in text_lower or ("login" in text_lower and ("fail" in text_lower or "unusual" in text_lower)):
        kql = f"""SigninLogs
| where {time_filter}
| where ResultType != 0
| where CountryOrRegion !in (dynamic(["US", "CA", "GB"]))  // unusual geolocations
| summarize FailedAttempts = count(), Countries = make_set(CountryOrRegion), IPs = make_set(IPAddress) by UserPrincipalName
| where FailedAttempts > 5
| order by FailedAttempts desc"""
        summary = "Finds failed sign-in attempts from geolocations not in the org's common countries, grouped by user."
        clauses = [
            {"clause": "SigninLogs", "plain_english": "Azure AD sign-in log table"},
            {"clause": f"where {time_filter}", "plain_english": "Restrict to the requested time window"},
            {"clause": "where ResultType != 0", "plain_english": "Filter to failed authentications only (non-zero result code means failure)"},
            {"clause": "where CountryOrRegion !in ...", "plain_english": "Exclude logins from common countries; adjust this list to match your org's baseline"},
            {"clause": "summarize ... by UserPrincipalName", "plain_english": "Count failures, collect unique countries and IPs per user"},
            {"clause": "where FailedAttempts > 5", "plain_english": "Surface only users with more than 5 failures to reduce noise"},
        ]
        assumptions = ["'Unusual geolocations' resolved to countries outside US/CA/GB — adjust to your org's geo baseline"]
    elif "lateral movement" in text_lower:
        kql = f"""SecurityEvent
| where {time_filter}
| where EventID in (4624, 4648, 4672)
| where LogonType in (3, 10)  // Network and RemoteInteractive logons
| summarize Targets = dcount(Computer), TargetList = make_set(Computer) by Account, IpAddress
| where Targets > 3
| order by Targets desc"""
        summary = "Detects accounts that logged into multiple systems via network logon — a lateral movement indicator."
        clauses = [
            {"clause": "SecurityEvent", "plain_english": "Windows Security Event Log table"},
            {"clause": f"where {time_filter}", "plain_english": "Time window filter"},
            {"clause": "where EventID in (4624, 4648, 4672)", "plain_english": "Successful logon, explicit credential logon, and special privilege assigned events"},
            {"clause": "where LogonType in (3, 10)", "plain_english": "Network and remote interactive logon types — typical of lateral movement"},
            {"clause": "where Targets > 3", "plain_english": "Flag accounts that touched more than 3 systems — threshold for lateral movement pattern"},
        ]
        assumptions = ["Threshold of 3 distinct systems is a starting point — tune based on your environment's norm"]
    elif "outbound" in text_lower or "network" in text_lower:
        kql = f"""DeviceNetworkEvents
| where {time_filter}
| where ActionType == "ConnectionSuccess"
| where RemoteIPType == "Public"
| where RemotePort !in (80, 443, 53, 123)
| summarize Connections = count(), Bytes = sum(AdditionalFields.BytesSent), Destinations = dcount(RemoteIP) by DeviceName, InitiatingProcessFileName
| where Bytes > 10000000 or Destinations > 20
| order by Bytes desc"""
        summary = "Finds devices with unusual outbound connections to public IPs on non-standard ports, indicating potential exfiltration or C2."
        clauses = [
            {"clause": "DeviceNetworkEvents", "plain_english": "Defender for Endpoint network connection table"},
            {"clause": "where ActionType == 'ConnectionSuccess'", "plain_english": "Only established connections, not attempts"},
            {"clause": "where RemoteIPType == 'Public'", "plain_english": "External internet destinations only"},
            {"clause": "where RemotePort !in (80, 443, 53, 123)", "plain_english": "Exclude standard web, DNS, and NTP ports to surface unusual traffic"},
            {"clause": "where Bytes > 10000000 or Destinations > 20", "plain_english": "Flag high-volume or high-destination-count activity"},
        ]
        assumptions = ["10MB data threshold and 20 distinct destinations are org-tunable thresholds"]
    elif "privilege" in text_lower or "escalation" in text_lower:
        kql = f"""SecurityEvent
| where {time_filter}
| where EventID in (4672, 4673, 4674)
| where SubjectUserName !endswith "$"  // exclude machine accounts
| where PrivilegeList has_any ("SeDebugPrivilege", "SeImpersonatePrivilege", "SeTcbPrivilege", "SeCreateTokenPrivilege")
| project TimeGenerated, Account = SubjectUserName, PrivilegeList, Computer, IpAddress
| order by TimeGenerated desc"""
        summary = "Identifies privilege escalation attempts by flagging sensitive privilege assignments to non-machine accounts."
        clauses = [
            {"clause": "where EventID in (4672, 4673, 4674)", "plain_english": "Special privileges assigned, privileged service called, and privileged object operation events"},
            {"clause": "where SubjectUserName !endswith '$'", "plain_english": "Filter out computer accounts (they end with $) to focus on user accounts"},
            {"clause": "where PrivilegeList has_any ...", "plain_english": "Only the highest-risk privileges that are commonly abused for escalation"},
        ]
        assumptions = ["Privilege list covers the top abuse targets — add tenant-specific sensitive groups as needed"]
    else:
        kql = f"""SecurityEvent
| where {time_filter}
| search "{text[:50]}"
| project TimeGenerated, Computer, Account, Activity, EventID
| order by TimeGenerated desc
| limit 100"""
        summary = f"Broad search for events matching: '{text[:50]}'. Refine with specific field filters for better signal."
        clauses = [
            {"clause": "SecurityEvent", "plain_english": "Windows Security Event Log table"},
            {"clause": f"where {time_filter}", "plain_english": "Time window filter"},
            {"clause": f'search "{text[:50]}"', "plain_english": "Full-text search across all fields — imprecise but broad coverage"},
        ]
        assumptions = ["Using free-text search as a fallback — consider specifying field names for faster, more accurate results"]

    return {
        "kql": kql,
        "summary": summary,
        "clauses": clauses,
        "assumptions": assumptions,
    }


def _doc_technical_mock(text: str) -> str:
    entity = "jsmith@corp.com" if "jsmith" in text.lower() else "the affected entity"
    return f"""## Technical Incident Report

**Classification:** CONFIDENTIAL | RESTRICTED
**Incident ID:** INC-2026-0042
**Analyst:** SentinelIQ AI
**Generated:** 2026-05-04T00:00:00Z

## Executive Overview

A credential compromise of {entity} was detected on 2026-05-03. Initial access was gained via a phishing email containing a malicious OAuth token harvesting link. The threat actor subsequently performed lateral movement to 3 internal systems including SERVER-DC01, and attempted privilege escalation via a known local admin path on DESKTOP-42.

## Timeline of Events

| Time (UTC) | Event | Confidence |
|------------|-------|------------|
| 2026-05-03 02:14 | Phishing link clicked — OAuth token harvested | High |
| 2026-05-03 02:31 | Successful login from RU (185.220.101.45) | High |
| 2026-05-03 03:02 | DESKTOP-42 local admin escalation | High |
| 2026-05-03 03:18 | Network logon to FILE-SRV01 (EventID 4648) | High |
| 2026-05-03 03:45 | LSASS memory access on SERVER-DC01 | Critical |
| 2026-05-03 04:12 | 312MB outbound transfer to 185.220.101.45 | High |

## Affected Systems

- **DESKTOP-42** — Risk score 78/100. Initial escalation point.
- **FILE-SRV01** — Risk score 55/100. Lateral movement target.
- **SERVER-DC01** — Risk score 91/100. Credential dumping attempted.

## Attack Chain Analysis

The attack follows a classic credential theft → lateral movement → data exfiltration chain mapped to ATT&CK techniques: T1566 (Phishing), T1078 (Valid Accounts), T1021 (Remote Services), T1003 (OS Credential Dumping), T1041 (Exfiltration Over C2 Channel).

## Forensic Artifacts

- Source IP: 185.220.101.45 (Tor exit node, RU geolocated)
- OAuth token: harvested via malicious app registration
- Process: `powershell.exe -EncodedCommand` on DESKTOP-42 at 03:02 UTC
- LSASS handle opened by non-system process at 03:45 UTC

## Remediation Steps

1. Disable and reset credentials for {entity}
2. Revoke all OAuth tokens and active sessions
3. Reimage DESKTOP-42 and FILE-SRV01
4. Rotate Domain Admin credentials on SERVER-DC01
5. Deploy detection rule RULE-003 (CredentialDumping) with enhanced scope
6. Conduct threat hunt for additional T1078 indicators across all user accounts
"""


def _doc_executive_mock(text: str) -> str:
    entity = "jsmith@corp.com" if "jsmith" in text.lower() else "a Finance team member"
    return f"""## Executive Security Briefing

**Incident:** Active Credential Compromise
**Severity:** HIGH
**Business Impact:** Potential data exposure; no ransomware or service disruption detected

## What Happened

A Finance team employee account ({entity}) was compromised through a targeted phishing attack. The attacker gained access to internal systems and attempted to steal credentials that could provide broader network access.

## What Was Affected

- 1 user account compromised
- 3 internal systems accessed without authorization
- Approximately 312 MB of data transferred to an external IP

## What We Did

- Account suspended within 4 hours of detection
- Affected systems isolated for forensic review
- No evidence of ransomware or service disruption
- Active monitoring deployed for related threat actor indicators

## What Happens Next

1. Full credential rotation for affected team (estimated 2 hours)
2. Forensic review of the 3 affected systems (estimated 48 hours)
3. Enhanced monitoring rules deployed to detect recurrence
4. User awareness training session scheduled for Finance team

## Risk Assessment

**Current risk:** MEDIUM — containment actions reduce immediate threat. Long-term risk depends on credential rotation completeness and detection rule effectiveness.
"""


def _doc_regulatory_mock(text: str) -> str:
    return """## Regulatory Breach Notification Draft

**GDPR Article 33 / CCPA Notification**
**Incident Reference:** INC-2026-0042
**Notification Deadline:** 72 hours from discovery (2026-05-06 ~14:00 UTC)

## Incident Description

On 2026-05-03, Contoso Corp detected unauthorized access to internal systems via a compromised employee credential. The breach was discovered through automated security monitoring at approximately 04:30 UTC.

## Data Types Potentially Affected

- Employee authentication credentials (usernames, session tokens)
- Finance team files accessed on FILE-SRV01 (scope under investigation)
- No confirmed exfiltration of PII or financial records at this time

## Timeline

| Date | Event |
|------|-------|
| 2026-05-03 02:14 UTC | Initial unauthorized access via phishing |
| 2026-05-03 04:30 UTC | Detection by automated security monitoring |
| 2026-05-03 05:00 UTC | Containment actions initiated |
| 2026-05-04 00:00 UTC | This notification drafted |

## Containment Actions Taken

1. Compromised account suspended and credentials reset
2. Affected systems isolated from network
3. All active sessions terminated
4. Enhanced monitoring deployed

## Regulatory Obligations

- **GDPR Art. 33**: Notification to supervisory authority required within 72 hours if personal data breach confirmed
- **CCPA**: Notification to affected individuals required if personal information compromised
- **Recommended action**: Legal review of data scope before filing; preliminary notification to DPA by 2026-05-06

## Contact

Data Protection Officer: [dpo@corp.com]
Incident Response Lead: Security Operations Center
"""


def _comparative_narrative_mock(text: str) -> str:
    text_lower = text.lower()
    entity = "jsmith@corp.com" if "jsmith" in text_lower else "the analyzed entity"
    is_high_deviation = any(w in text_lower for w in ["anomaly", "⚠", "deviation", "99th", "95th"])

    if is_high_deviation or "jsmith" in text_lower:
        return (
            f"Behavioral analysis of {entity} reveals significant deviations across multiple dimensions that are highly inconsistent with normal activity patterns. "
            f"The most critical anomaly is outbound data volume, which is running at 6x the organizational baseline (312 MB vs 50 MB/day) — a strong indicator of data staging or exfiltration activity. "
            f"Additionally, the account shows 3 distinct login geographies where only 1 is expected, and 7 failed authentication attempts against a baseline of under 1 per day.\n\n"
            f"The failed login pattern followed by a successful overseas login suggests a credential stuffing attack succeeded after multiple attempts. "
            f"The encoded PowerShell executions (3 events vs. near-zero baseline) combined with the lateral movement to 9 unique hosts (baseline: 2.3) strongly suggest the account is being actively operated by a threat actor post-compromise.\n\n"
            f"Recommended immediate actions: (1) Suspend the account and revoke sessions, (2) run a blast radius analysis to determine reachable assets, "
            f"(3) hunt for T1003/T1021 indicators on the 9 accessed hosts, (4) deploy detection rule for this behavioral fingerprint to catch recurrence."
        )
    return (
        f"Behavioral analysis of {entity} shows activity within normal operating parameters for this entity. "
        f"Login frequency, geographic distribution, and network activity are all within 1 standard deviation of the organizational baseline. "
        f"No significant anomalies were detected in the analysis window.\n\n"
        f"The entity's peer percentile score indicates behavior is typical relative to similar roles in the organization. "
        f"Encoded PowerShell executions and lateral movement events are at or below baseline.\n\n"
        f"No immediate action is required. Continue standard monitoring and revisit if new alerts surface for this entity."
    )


def _rule_suggestion_mock(text: str) -> dict:
    text_lower = text.lower()

    if "geo" in text_lower or "country" in text_lower or "unusual location" in text_lower or "signin" in text_lower:
        return {
            "rule_name": "GeoAnomalyNewCountryLogin",
            "rule_description": "Detects first-time login from a new country for a given user — enhanced with risk scoring and VPN exclusion",
            "kql": "SigninLogs\n| where TimeGenerated > ago(1h)\n| where ResultType == 0\n| join kind=leftouter (\n    SigninLogs\n    | where TimeGenerated > ago(90d)\n    | summarize KnownCountries=make_set(CountryOrRegion), KnownIPs=make_set(IPAddress) by UserPrincipalName\n) on UserPrincipalName\n| where CountryOrRegion !in (KnownCountries)\n| where IPAddress !in (KnownIPs)\n| extend RiskScore = iff(CountryOrRegion in ('RU','CN','IR','KP'), 90, 60)\n| project TimeGenerated, UserPrincipalName, CountryOrRegion, IPAddress, RiskScore\n| order by RiskScore desc",
            "severity": "high",
            "technique_ids": ["T1078", "T1133"],
            "mitre_tactics": ["Initial Access", "Defense Evasion"],
            "false_positive_guidance": "Business travel, VPN exit nodes, and remote work from new locations. Maintain an approved-travel IP list and route exceptions through the allowlist process.",
            "estimated_fp_rate": 0.10,
            "tuning_recommendations": [
                "Add exclusion for corporate VPN IP ranges (10.0.0.0/8, 192.168.0.0/16)",
                "Reduce lookback from 90 days to 30 days for more dynamic baselines",
                "Add MFA status field to triage high-confidence alerts automatically",
            ],
        }
    elif "powershell" in text_lower or "encoded" in text_lower or "t1059" in text_lower:
        return {
            "rule_name": "EncodedPowerShellHighEntropy",
            "rule_description": "Detects PowerShell with Base64-encoded commands, enhanced with process ancestry and entropy scoring",
            "kql": "DeviceProcessEvents\n| where TimeGenerated > ago(1h)\n| where FileName =~ 'powershell.exe'\n| where ProcessCommandLine matches regex '(?i)-(e|enc|encodedcommand)\\\\s+[A-Za-z0-9+/=]{20,}'\n| extend ParentProcess = InitiatingProcessFileName\n| extend IsSuspiciousParent = ParentProcess in~ ('services.exe','svchost.exe','winword.exe','excel.exe','outlook.exe')\n| extend EntropyLen = strlen(extract('-(e|enc|encodedcommand)\\\\s+([A-Za-z0-9+/=]+)', 2, ProcessCommandLine))\n| where IsSuspiciousParent or EntropyLen > 200\n| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine, ParentProcess, IsSuspiciousParent",
            "severity": "high",
            "technique_ids": ["T1059", "T1027"],
            "mitre_tactics": ["Execution", "Defense Evasion"],
            "false_positive_guidance": "Legitimate admin automation and monitoring agents use encoded PowerShell. Allowlist specific known-good base64 hashes and add parent process exclusions for trusted admin tools (psexec, ansible).",
            "estimated_fp_rate": 0.18,
            "tuning_recommendations": [
                "Allowlist known monitoring agent process hashes",
                "Add minimum encoded string length threshold (>200 chars reduces noise)",
                "Exclude known CI/CD runner accounts from alerting",
            ],
        }
    elif "lateral" in text_lower or "smb" in text_lower or "t1021" in text_lower:
        return {
            "rule_name": "LateralMovementMultiTargetSMB",
            "rule_description": "Detects accounts using explicit credentials to access multiple systems via SMB within a short window",
            "kql": "SecurityEvent\n| where TimeGenerated > ago(1h)\n| where EventID == 4648\n| where SubjectUserName !endswith '$'\n| where TargetServerName !in ('localhost','127.0.0.1')\n| summarize count(), Targets=make_set(TargetServerName), FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated)\n    by SubjectUserName, WorkstationName\n| where count_ > 3\n| extend SpreadMinutes = datetime_diff('minute', LastSeen, FirstSeen)\n| where SpreadMinutes < 60\n| order by count_ desc",
            "severity": "high",
            "technique_ids": ["T1021", "T1078"],
            "mitre_tactics": ["Lateral Movement"],
            "false_positive_guidance": "Deployment scripts, backup agents, and admin tools scanning multiple hosts. Allowlist service accounts used for legitimate multi-host operations.",
            "estimated_fp_rate": 0.07,
            "tuning_recommendations": [
                "Adjust target count threshold from 3 to 5 for larger environments",
                "Add time-window compression analysis (rapid spread in <10 min is higher confidence)",
                "Exclude known backup service accounts",
            ],
        }
    else:
        return {
            "rule_name": "SuspiciousAuthenticationPattern",
            "rule_description": "Detects anomalous authentication patterns based on investigation findings — failed logins followed by success from new IP",
            "kql": "let FailedLogins = SigninLogs\n| where TimeGenerated > ago(1h)\n| where ResultType != 0\n| summarize FailCount=count() by UserPrincipalName, IPAddress;\nSigninLogs\n| where TimeGenerated > ago(1h)\n| where ResultType == 0\n| join kind=inner (FailedLogins) on UserPrincipalName\n| where FailCount > 5\n| project TimeGenerated, UserPrincipalName, IPAddress, CountryOrRegion, FailCount",
            "severity": "high",
            "technique_ids": ["T1078", "T1110"],
            "mitre_tactics": ["Initial Access", "Credential Access"],
            "false_positive_guidance": "Users who genuinely forgot passwords and then succeeded. Add a cooldown period — only alert if success follows failure within 30 minutes.",
            "estimated_fp_rate": 0.15,
            "tuning_recommendations": [
                "Tune FailCount threshold per environment (5 is aggressive)",
                "Add IP reputation scoring to auto-close known-good IPs",
                "Correlate with MFA bypass events for higher confidence",
            ],
        }


def _build_chips(text: str) -> dict:
    text_lower = text.lower()
    default_chips = [
        {"id": "chip_1", "label": "Correlate with lateral movement", "type": "query", "prompt_text": "Find lateral movement patterns from the same entities in the last 24 hours"},
        {"id": "chip_2", "label": "Estimate blast radius", "type": "action", "prompt_text": "Estimate blast radius for the accounts found in this query"},
        {"id": "chip_3", "label": "Find related alerts", "type": "query", "prompt_text": "Show me related alerts for the entities found in this search"},
        {"id": "chip_4", "label": "Write triage summary", "type": "action", "prompt_text": "Summarize this investigation as a triage report"},
        {"id": "chip_5", "label": "Create detection rule", "type": "action", "prompt_text": "Create a detection rule for this pattern"},
    ]
    if "login" in text_lower or "auth" in text_lower:
        default_chips[0] = {"id": "chip_1", "label": "Check MFA bypass", "type": "query", "prompt_text": "Find authentication events that bypassed MFA for the same users"}
    elif "network" in text_lower or "outbound" in text_lower:
        default_chips[0] = {"id": "chip_1", "label": "Check DNS queries", "type": "query", "prompt_text": "Find DNS queries from the same hosts to rare domains in the last 24 hours"}
    return {"chips": default_chips}


async def complete_mock(
    messages: list[dict],
    system: str,
    model: str,
    max_tokens: int = 1024,
    **kwargs,
) -> str:
    user_msg = ""
    for m in messages:
        if m.get("role") == "user":
            content = m.get("content", "")
            user_msg = content if isinstance(content, str) else str(content)
            break

    # Route to appropriate mock based on system prompt content
    if "intent classifier" in system.lower() or "classify" in system.lower():
        return json.dumps(_detect_mode(user_msg))
    elif "stage 1" in system.lower() or "semantic parsing" in system.lower():
        return json.dumps(_parse_semantic(user_msg))
    elif "stage 2" in system.lower() or "descriptor resolution" in system.lower():
        return json.dumps({"resolved": [
            {"descriptor": "unusual", "kql_condition": "CountryOrRegion !in (dynamic(['US','CA','GB']))", "assumption": "'Unusual' resolved to locations outside common org countries using 90-day geo baseline placeholder"}
        ] if "unusual" in user_msg.lower() else []})
    elif "stage 3" in system.lower() or ("generate kql" in system.lower() and "explain" not in system.lower()):
        # NLQ construct — user_msg is parsed intent + resolved descriptors
        # Extract any original query hint from context
        built = _build_kql_from_intent(user_msg)
        return json.dumps({"kql": built["kql"], "tables_used": [built["table"]], "has_join": False, "has_aggregation": True})
    elif "stage 4" in system.lower() or "plain-english explanation" in system.lower():
        # user_msg is the KQL + resolved descriptors — parse KQL to build explanation
        return json.dumps(_explain_kql(user_msg))
    elif "rule suggestion enhanced" in system.lower():
        return json.dumps(_rule_suggestion_mock(user_msg))
    elif "suggestion" in system.lower() or "chip" in system.lower():
        return json.dumps(_build_chips(user_msg))
    elif "alert triage" in system.lower() or "tp_probability" in system.lower() or ("score" in system.lower() and "alert" in system.lower()):
        return json.dumps(_score_alert_mock(user_msg))
    elif "hunt" in system.lower() and "narrative" in system.lower():
        return _hunt_narrative_mock(user_msg)
    elif "timeline annotation" in system.lower() or ("one sentence" in system.lower() and "tactic" in system.lower()):
        return _stage_annotation_mock(user_msg)
    elif "documentation technical" in system.lower():
        return _doc_technical_mock(user_msg)
    elif "documentation executive" in system.lower():
        return _doc_executive_mock(user_msg)
    elif "documentation regulatory" in system.lower():
        return _doc_regulatory_mock(user_msg)
    elif "comparative behavioral" in system.lower():
        return _comparative_narrative_mock(user_msg)
    elif "summariz" in system.lower():
        return """## Investigation Summary

**What happened:** This investigation examined suspicious authentication patterns and network activity across multiple log sources.

**Entities involved:** Multiple user accounts and hosts flagged for anomalous behavior patterns.

**Key findings:**
- Elevated failed login rate from geographically diverse sources
- Activity outside normal business hours
- Lateral movement indicators detected on 2 hosts

**Recommended next steps:**
1. Reset credentials for all flagged accounts
2. Review and terminate active sessions
3. Check for persistence mechanisms on flagged hosts
4. Deploy detection rule to alert on recurrence
"""
    elif "detection rule" in system.lower() or "rule" in system.lower():
        return """## Detection Rule: Geo-Anomaly Authentication Attempt

**Purpose:** Detects successful logins from countries not seen in the last 90 days for a given user.

**KQL Rule:**
```kql
SigninLogs
| where TimeGenerated > ago(1h)
| where ResultType == 0  // successful logins only
| where CountryOrRegion !in (dynamic(["US", "CA", "GB"]))
| summarize count() by UserPrincipalName, CountryOrRegion
| where count_ > 1
```

**Severity:** High
**MITRE ATT&CK:** T1078 (Valid Accounts), T1133 (External Remote Services)
**False Positive Guidance:** Business travel, VPN exit nodes, and third-party services may trigger. Add known travel IPs to exclusion list.
**Estimated Daily Volume:** 2-5 alerts per 1000 users
"""
    else:
        return json.dumps({"result": "Mock response", "note": "Mock LLM active — add API credits to enable real AI responses"})


async def stream_mock(
    messages: list[dict],
    system: str,
    model: str,
    max_tokens: int = 2048,
) -> AsyncIterator[str]:
    text = await complete_mock(messages, system, model, max_tokens)
    # Stream character by character in chunks for realistic feel
    chunk_size = 20
    for i in range(0, len(text), chunk_size):
        yield text[i:i + chunk_size]
