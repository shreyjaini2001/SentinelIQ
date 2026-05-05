import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from src.models.requests import ActionRequest
from src.components import action_dispatcher, session_manager

router = APIRouter()


@router.post("/action")
async def dispatch_action(req: ActionRequest):
    ctx = await session_manager.get_or_create(req.session_id)

    async def event_stream():
        async for event in action_dispatcher.dispatch(
            intent_label=req.text,
            ctx=ctx,
            confirmed_handler=req.confirmed_handler,
        ):
            event_type = event.get("type", "progress")
            data = json.dumps({k: v for k, v in event.items() if k != "type"})
            yield f"event: {event_type}\ndata: {data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/action/registry")
async def get_registry():
    return {"handlers": action_dispatcher.get_registry_info()}
