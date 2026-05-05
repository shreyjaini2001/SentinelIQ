from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.capabilities import triage, threat_hunt, timeline

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
