from fastapi import APIRouter
from src.models.requests import ClassifyRequest, ClassifyResponse
from src.components import intent_classifier
from src.components import session_manager

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
async def classify_intent(req: ClassifyRequest) -> ClassifyResponse:
    session_summary = None
    if req.session_id:
        ctx = await session_manager.get_or_create(req.session_id)
        session_summary = session_manager.build_session_summary(ctx)

    return await intent_classifier.classify(req.text, session_summary)
