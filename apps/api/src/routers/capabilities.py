from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.capabilities import triage, threat_hunt, timeline
from src.capabilities import blast_radius, documentation, comparative, rule_suggestion
from src.capabilities import handoff, runbook, noise_coaching

router = APIRouter()


# ── Alert Triage (Capability 1) ──────────────────────────────────────────────

class TriageRequest(BaseModel):
    alerts: list[triage.AlertInput] | None = None
    use_sample: bool = False
    sample_count: int = 5


@router.post("/triage", response_model=triage.TriageResult)
async def triage_alerts(req: TriageRequest):
    if req.use_sample or not req.alerts:
        alerts = triage.make_sample_alerts(req.sample_count)
    else:
        alerts = req.alerts
    if len(alerts) > 200:
        raise HTTPException(status_code=400, detail="Maximum 200 alerts per triage batch")
    return await triage.triage_alerts(alerts)


# ── Threat Hunt (Capability 2) ────────────────────────────────────────────────

class HuntRequest(BaseModel):
    query: str
    time_window: str = "7d"


@router.post("/hunt", response_model=threat_hunt.HuntResult)
async def run_hunt(req: HuntRequest):
    return await threat_hunt.run_hunt(req.query, req.time_window)


@router.get("/hunt/techniques")
async def list_techniques():
    return {
        "techniques": {
            tid: {"name": t["name"], "tactic": t["tactic"]}
            for tid, t in threat_hunt.ATTACK_TECHNIQUES.items()
        },
        "threat_actors": list(threat_hunt.THREAT_ACTORS.keys()),
    }


# ── Timeline Reconstruction (Capability 3) ───────────────────────────────────

class TimelineRequest(BaseModel):
    seed_entity: str
    window_hours_before: float = 2.0
    window_minutes_after: float = 30.0


@router.post("/timeline", response_model=timeline.TimelineResult)
async def reconstruct(req: TimelineRequest):
    return await timeline.reconstruct_timeline(
        seed_entity=req.seed_entity,
        window_hours_before=req.window_hours_before,
        window_minutes_after=req.window_minutes_after,
    )


# ── Blast Radius Estimation (Capability 4) ───────────────────────────────────

class BlastRadiusRequest(BaseModel):
    seed_entity: str


@router.post("/blast-radius", response_model=blast_radius.BlastRadiusResult)
async def estimate_blast_radius(req: BlastRadiusRequest):
    if not req.seed_entity.strip():
        raise HTTPException(status_code=400, detail="seed_entity is required")
    return blast_radius.estimate_blast_radius(req.seed_entity)


# ── Documentation (Capability 5) ─────────────────────────────────────────────

class DocumentationRequest(BaseModel):
    variant: documentation.Variant = "technical"
    entity_scope: str = "Active investigation"
    context_text: str = ""


@router.post("/documentation", response_model=documentation.DocumentationResult)
async def generate_documentation(req: DocumentationRequest):
    return await documentation.generate_documentation(
        variant=req.variant,
        entity_scope=req.entity_scope,
        context_text=req.context_text or "No additional context provided.",
    )


# ── Comparative Analysis (Capability 6) ──────────────────────────────────────

class ComparativeRequest(BaseModel):
    entity: str
    window: str = "24h"


@router.post("/comparative", response_model=comparative.ComparativeResult)
async def compare_entity(req: ComparativeRequest):
    if not req.entity.strip():
        raise HTTPException(status_code=400, detail="entity is required")
    return await comparative.compare_entity(req.entity, req.window)


# ── Rule Suggestion (Capability 7) ───────────────────────────────────────────

class RuleSuggestionRequest(BaseModel):
    context_text: str


@router.post("/rule-suggestion", response_model=rule_suggestion.RuleSuggestionResult)
async def suggest_rule(req: RuleSuggestionRequest):
    if not req.context_text.strip():
        raise HTTPException(status_code=400, detail="context_text is required")
    return await rule_suggestion.suggest_rule(req.context_text)


# ── Shift Handoff Briefing (Capability 8) ────────────────────────────────────

class HandoffRequest(BaseModel):
    context_text: str = ""
    shift_window: str = "last 8 hours"


@router.post("/handoff", response_model=handoff.HandoffBriefingResult)
async def generate_handoff(req: HandoffRequest):
    return await handoff.generate_handoff(
        context_text=req.context_text,
        shift_window=req.shift_window,
    )


# ── Runbook Generation (Capability 9) ────────────────────────────────────────

class RunbookRequest(BaseModel):
    context_text: str
    scenario_hint: str = ""


@router.post("/runbook", response_model=runbook.RunbookResult)
async def generate_runbook(req: RunbookRequest):
    if not req.context_text.strip():
        raise HTTPException(status_code=400, detail="context_text is required")
    return await runbook.generate_runbook(
        context_text=req.context_text,
        scenario_hint=req.scenario_hint,
    )


# ── Noise Reduction Coaching (Capability 10) ─────────────────────────────────

class NoiseCoachingRequest(BaseModel):
    context_text: str
    rule_name_hint: str = ""


@router.post("/noise-coaching", response_model=noise_coaching.NoiseCoachingResult)
async def analyze_noise(req: NoiseCoachingRequest):
    if not req.context_text.strip():
        raise HTTPException(status_code=400, detail="context_text is required")
    return await noise_coaching.analyze_noise(
        context_text=req.context_text,
        rule_name_hint=req.rule_name_hint,
    )
