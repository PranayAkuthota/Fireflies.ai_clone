from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.models import Participant
from app.schemas.schemas import ParticipantResponse

router = APIRouter(prefix="/participants", tags=["participants"])

@router.get("", response_model=List[ParticipantResponse])
async def list_participants(db: AsyncSession = Depends(get_db)):
    """
    Returns a list of all registered participants.
    Used for dropdown filters on the dashboard.
    """
    result = await db.execute(select(Participant).order_by(Participant.name.asc()))
    participants = result.scalars().all()
    return participants
