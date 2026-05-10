"""
Capability 9 — Runbook Generation
PRD §7.2: Generates a structured incident response runbook from context and fixture data.
"""
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from src.llm import client as llm
from src.providers import get_data_provider
from config import settings

_RUNBOOK_SYSTEM = (
    "You are SentinelIQ's runbook generation AI. "
    "Write a 2-3 sentence summary for this incident response runbook. "
    "Focus on: the alert scenario, priority, and what the analyst must do first. "
    "Be concise and direct. "
    "runbook generation response"
)

_SCENARIO_KEYWORDS = {
    "privilege": ("privilege_escalation", "Privilege Escalation", ["T1068", "T1078", "T1548"]),
    "escalation": ("privilege_escalation", "Privilege Escalation", ["T1068", "T1078", "T1548"]),
    "credential": ("credential_dumping", "Credential Dumping / Access", ["T1003", "T1552", "T1558"]),
    "lsass": ("credential_dumping", "Credential Dumping / Access", ["T1003", "T1552"]),
    "lateral": ("lateral_movement", "Lateral Movement", ["T1021", "T1078", "T1570"]),
    "smb": ("lateral_movement", "Lateral Movement", ["T1021", "T1078"]),
    "phish": ("phishing", "Phishing / Initial Access", ["T1566", "T1059", "T1078"]),
    "exfil": ("data_exfiltration", "Data Exfiltration", ["T1041", "T1048", "T1567"]),
    "ransomware": ("ransomware", "Ransomware Response", ["T1486", "T1490", "T1489"]),
    "powershell": ("malicious_execution", "Malicious Code Execution", ["T1059", "T1027", "T1055"]),
    "encoded": ("malicious_execution", "Malicious Code Execution", ["T1059", "T1027"]),
    "geo": ("account_compromise", "Suspicious Authentication", ["T1078", "T1133"]),
    "brute": ("account_compromise", "Brute Force / Account Compromise", ["T1110", "T1078"]),
}

_RUNBOOK_TEMPLATES = {
    "privilege_escalation": [
        {"action": "Identify the account and host where escalation occurred", "role": "Tier 1 SOC", "minutes": 5, "tools": ["SecurityEvent | where EventID == 4672", "Get-WinEvent -Id 4672"]},
        {"action": "Verify whether privilege assignment was authorized (change ticket or scheduled task)", "role": "Tier 1 SOC", "minutes": 10, "tools": ["ServiceNow CMDB", "Jira change log search"], "branch": "If authorized → close alert. If unauthorized → escalate."},
        {"action": "Suspend the affected account and revoke all active sessions", "role": "Tier 2 IR", "minutes": 5, "tools": ["Entra ID Admin Center", "Revoke-AzureADUserAllRefreshToken"]},
        {"action": "Collect full process tree and parent chain from the escalation host", "role": "Tier 2 IR", "minutes": 15, "tools": ["MDE Advanced Hunting", "Get-Process -IncludeUserName"]},
        {"action": "Hunt for lateral movement from the affected account in the past 24 hours", "role": "Tier 2 IR", "minutes": 20, "tools": ["SecurityEvent lateral movement KQL", "MDE DeviceLogonEvents"]},
        {"action": "Document findings, update incident ticket, notify manager if Tier 2 cannot contain within 30 min", "role": "Tier 1 SOC", "minutes": 10, "tools": ["ServiceNow INC ticket", "Teams escalation channel"]},
    ],
    "credential_dumping": [
        {"action": "Confirm LSASS access by non-system process — check initiating process and parent", "role": "Tier 2 IR", "minutes": 5, "tools": ["MDE: DeviceProcessEvents | where FileName =~ 'lsass.exe'"]},
        {"action": "Immediately isolate the affected host from the network", "role": "Tier 2 IR", "minutes": 3, "tools": ["MDE Isolate Device action", "Network ACL block"]},
        {"action": "Reset all domain admin and privileged account passwords", "role": "Identity Team", "minutes": 20, "tools": ["Active Directory Users and Computers", "Set-ADAccountPassword"]},
        {"action": "Run golden ticket / kerberoasting check on domain controllers", "role": "Tier 2 IR", "minutes": 15, "tools": ["Invoke-Kerberoast.ps1", "Get-ADUser -Filter {ServicePrincipalName -ne '$null'}"]},
        {"action": "Forensically image the affected host for offline analysis", "role": "Tier 3 Forensics", "minutes": 60, "tools": ["FTK Imager", "WinPMEM for memory acquisition"]},
        {"action": "Notify CISO and activate incident response plan if domain admin credentials are confirmed stolen", "role": "SOC Manager", "minutes": 10, "tools": ["Incident declaration template", "CISO hotline"]},
    ],
    "lateral_movement": [
        {"action": "Identify all systems accessed by the source account in the last 2 hours", "role": "Tier 1 SOC", "minutes": 10, "tools": ["SecurityEvent | where EventID in (4624,4648) | where LogonType in (3,10)"]},
        {"action": "Verify whether the accessed systems are authorized for this account", "role": "Tier 1 SOC", "minutes": 5, "tools": ["Active Directory group membership", "CMDB owner lookup"], "branch": "If authorized → document. If not → escalate to Tier 2."},
        {"action": "Contain the source account and block the source IP at the firewall", "role": "Tier 2 IR", "minutes": 10, "tools": ["Entra ID block", "Palo Alto firewall policy", "CrowdStrike Falcon contain"]},
        {"action": "Check each accessed system for persistence mechanisms (scheduled tasks, registry run keys)", "role": "Tier 2 IR", "minutes": 25, "tools": ["Get-ScheduledTask", "Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"]},
        {"action": "Run blast radius analysis to identify all assets reachable from the compromised account", "role": "Tier 2 IR", "minutes": 15, "tools": ["SentinelIQ Blast Radius action", "MDE Advanced Hunting"]},
        {"action": "Update incident ticket and escalate if more than 3 systems are confirmed compromised", "role": "Tier 1 SOC", "minutes": 5, "tools": ["ServiceNow", "Teams IR channel"]},
    ],
    "phishing": [
        {"action": "Identify all recipients of the phishing email using email security platform", "role": "Tier 1 SOC", "minutes": 10, "tools": ["Microsoft Defender for Office 365", "PowerShell: Get-MessageTrace"]},
        {"action": "Quarantine phishing email from all mailboxes", "role": "Tier 1 SOC", "minutes": 5, "tools": ["Purge-MailboxMessage", "Defender for O365 Threat Explorer"]},
        {"action": "Check if any recipients clicked the link or opened the attachment", "role": "Tier 1 SOC", "minutes": 10, "tools": ["OfficeActivity | where UserId in @recipients | where Operation =~ 'AttachmentAccessed'"], "branch": "If clicked → escalate to Tier 2. If not → monitor for 24h."},
        {"action": "For any users who clicked: isolate their machine and disable account", "role": "Tier 2 IR", "minutes": 15, "tools": ["MDE Isolate Device", "Entra ID disable user"]},
        {"action": "Submit IOCs (URL, attachment hash, sender IP) to threat intel platform", "role": "Tier 2 IR", "minutes": 10, "tools": ["VirusTotal API", "MISP platform", "Defender TI"]},
        {"action": "Notify affected users and initiate targeted awareness training", "role": "Security Awareness Team", "minutes": 30, "tools": ["KnowBe4 targeted phishing simulation", "Email notification template"]},
    ],
    "account_compromise": [
        {"action": "Verify if login is legitimate — check with user via out-of-band channel", "role": "Tier 1 SOC", "minutes": 5, "tools": ["Phone/Teams call to user", "MFA push notification review"], "branch": "If legitimate → document and close. If not → proceed."},
        {"action": "Disable account and revoke all active sessions immediately", "role": "Tier 1 SOC", "minutes": 3, "tools": ["Entra ID: Disable user", "Revoke-AzureADUserAllRefreshToken"]},
        {"action": "Identify all resources accessed during the suspicious session", "role": "Tier 2 IR", "minutes": 15, "tools": ["Entra ID Sign-in logs", "SharePoint audit log", "Exchange mailbox audit"]},
        {"action": "Check for MFA bypass or legacy authentication usage", "role": "Tier 2 IR", "minutes": 10, "tools": ["SigninLogs | where AuthenticationRequirement == 'singleFactorAuthentication'"]},
        {"action": "Reset account credentials and re-enroll MFA with physical verification", "role": "Identity Team", "minutes": 20, "tools": ["Azure AD Password Reset", "Microsoft Authenticator re-enrollment"]},
        {"action": "Review and update Conditional Access policies to block the attack vector used", "role": "Identity Team", "minutes": 30, "tools": ["Entra ID Conditional Access", "Named Locations configuration"]},
    ],
    "malicious_execution": [
        {"action": "Collect full command line and process ancestry for the flagged execution", "role": "Tier 1 SOC", "minutes": 5, "tools": ["MDE: DeviceProcessEvents | where ProcessCommandLine contains '-enc'"]},
        {"action": "Decode base64 payload and run through sandbox for behavioral analysis", "role": "Tier 2 IR", "minutes": 15, "tools": ["CyberChef base64 decode", "Any.run sandbox", "Hybrid Analysis"]},
        {"action": "Check network connections made by the process during/after execution", "role": "Tier 2 IR", "minutes": 10, "tools": ["MDE: DeviceNetworkEvents | where InitiatingProcessFileName =~ 'powershell.exe'"]},
        {"action": "Scan the host for persistence artifacts deposited by the payload", "role": "Tier 2 IR", "minutes": 20, "tools": ["Autoruns (Sysinternals)", "Get-ScheduledTask", "reg query HKLM\\System\\CurrentControlSet\\Services"]},
        {"action": "Isolate host if payload shows C2 communication or dropped additional files", "role": "Tier 2 IR", "minutes": 3, "tools": ["MDE Isolate Device action"]},
        {"action": "Create tuned detection rule based on specific parent process and command pattern", "role": "Detection Engineering", "minutes": 45, "tools": ["SentinelIQ Rule Suggestion", "MDE custom detection rules"]},
    ],
    "data_exfiltration": [
        {"action": "Identify volume, destination, and file types of data transferred", "role": "Tier 2 IR", "minutes": 15, "tools": ["DeviceNetworkEvents | where BytesSent > 1000000", "DLP audit log"]},
        {"action": "Block the exfiltration destination IP/domain at the proxy/firewall", "role": "Network Security", "minutes": 5, "tools": ["Palo Alto URL filter", "Zscaler policy block", "DNS sinkhole"]},
        {"action": "Determine what data was likely exfiltrated — classify sensitivity", "role": "Data Classification Team", "minutes": 30, "tools": ["Purview data catalog", "File classification labels", "SharePoint audit"]},
        {"action": "Notify legal and privacy team if PII or regulated data is involved", "role": "SOC Manager / Legal", "minutes": 15, "tools": ["Incident escalation template", "GDPR/CCPA notification checklist"]},
        {"action": "Preserve forensic artifacts — do NOT wipe or power off affected systems", "role": "Tier 3 Forensics", "minutes": 20, "tools": ["FTK Imager", "WinPMEM", "dd for Linux"]},
        {"action": "Initiate regulatory breach notification review (72-hour GDPR clock)", "role": "Legal / DPO", "minutes": 60, "tools": ["GDPR Art. 33 notification template", "Regulatory counsel contact"]},
    ],
    "ransomware": [
        {"action": "IMMEDIATELY isolate all affected systems from the network — do not power off", "role": "All SOC", "minutes": 3, "tools": ["MDE Isolate Device (bulk action)", "VLAN isolation", "Emergency network ACL"]},
        {"action": "Identify patient zero — first system to show encryption activity", "role": "Tier 2 IR", "minutes": 10, "tools": ["DeviceFileEvents | where ActionType == 'FileModified' | order by Timestamp asc"]},
        {"action": "Activate Business Continuity Plan — notify executive leadership immediately", "role": "SOC Manager / CISO", "minutes": 5, "tools": ["BCP runbook", "Executive crisis hotline", "Out-of-band comms (phone)"]},
        {"action": "Preserve encrypted file samples and ransom note for forensic and decryption analysis", "role": "Tier 3 Forensics", "minutes": 20, "tools": ["Memory forensics", "Controlled sample collection"]},
        {"action": "Check backup integrity and initiate restore procedure from last clean backup", "role": "IT Ops / Backup Team", "minutes": 60, "tools": ["Veeam backup console", "Azure Backup portal", "Immutable backup validation"]},
        {"action": "Engage incident response retainer and law enforcement notification", "role": "CISO / Legal", "minutes": 30, "tools": ["IR retainer hotline", "FBI IC3 report", "CISA coordination"]},
    ],
}

_DEFAULT_TEMPLATE = _RUNBOOK_TEMPLATES["account_compromise"]


def _detect_scenario(text: str) -> tuple[str, str, list[str]]:
    text_lower = text.lower()
    for keyword, (scenario_id, label, techs) in _SCENARIO_KEYWORDS.items():
        if keyword in text_lower:
            return scenario_id, label, techs
    return "account_compromise", "Suspicious Account Activity", ["T1078", "T1133"]


class RunbookStep(BaseModel):
    step_number: int
    action: str
    role_owner: str
    estimated_minutes: int
    tools_commands: list[str]
    decision_branch: str | None


class RunbookResult(BaseModel):
    runbook_id: str
    title: str
    alert_type: str
    scenario: str
    steps: list[RunbookStep]
    related_techniques: list[str]
    similar_incidents: list[str]
    estimated_total_minutes: int
    narrative: str
    duration_ms: int


async def generate_runbook(
    context_text: str,
    scenario_hint: str = "",
) -> RunbookResult:
    start = datetime.now(timezone.utc)
    dp = get_data_provider()

    past = dp.get_past_investigations()
    rules = dp.get_detection_rules()
    techniques = dp.get_attack_techniques()

    search_text = f"{context_text} {scenario_hint}".strip()
    scenario_id, scenario_label, technique_ids = _detect_scenario(search_text)

    steps_raw = _RUNBOOK_TEMPLATES.get(scenario_id, _DEFAULT_TEMPLATE)
    steps = [
        RunbookStep(
            step_number=i + 1,
            action=s["action"],
            role_owner=s.get("role", "SOC Analyst"),
            estimated_minutes=s.get("minutes", 15),
            tools_commands=s.get("tools", []),
            decision_branch=s.get("branch"),
        )
        for i, s in enumerate(steps_raw)
    ]

    # Find similar past incidents
    similar_incidents: list[str] = []
    for inv in past:
        inv_ttps = set(inv.get("ttps", []))
        if inv_ttps & set(technique_ids):
            similar_incidents.append(
                f"{inv.get('investigation_id', '')} — {inv.get('title', '')} "
                f"({inv.get('outcome', 'unknown')})"
            )
    if not similar_incidents:
        similar_incidents = ["No directly matching past investigations in fixture data"]

    # Enrich technique names
    full_techs = []
    for tid in technique_ids:
        tech = techniques.get(tid, {})
        name = tech.get("name", tid)
        full_techs.append(f"{tid} ({name})")

    estimated_total = sum(s.estimated_minutes for s in steps)

    # Find a matching rule for title
    rule_name = scenario_label
    for rule in rules:
        rule_techs = set(rule.get("technique_ids", []))
        if rule_techs & set(technique_ids):
            rule_name = rule.get("name", scenario_label)
            break

    narrative = await llm.complete(
        messages=[{"role": "user", "content": f"Scenario: {scenario_label}. Context: {context_text[:300]}"}],
        system=_RUNBOOK_SYSTEM,
        model=settings.action_model,
        max_tokens=256,
        use_cache=True,
    )

    end = datetime.now(timezone.utc)

    return RunbookResult(
        runbook_id=str(uuid.uuid4()),
        title=f"{scenario_label} Response Runbook",
        alert_type=rule_name,
        scenario=scenario_label,
        steps=steps,
        related_techniques=full_techs,
        similar_incidents=similar_incidents[:3],
        estimated_total_minutes=estimated_total,
        narrative=narrative,
        duration_ms=int((end - start).total_seconds() * 1000),
    )
