from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.models import ActionItem, Meeting
from app.schemas.schemas import ActionItemCreate, ActionItemUpdate, ActionItemResponse

router = APIRouter(prefix="/meetings/{meeting_id}/action-items", tags=["action-items"])

@router.post("", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
async def create_action_item(
    meeting_id: int, 
    item_data: ActionItemCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new action item associated with a meeting.
    """
    meeting = await db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found."
        )
        
    db_item = ActionItem(
        meeting_id=meeting_id,
        text=item_data.text,
        is_completed=item_data.is_completed,
        assigned_to=item_data.assigned_to
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=ActionItemResponse)
async def update_action_item(
    meeting_id: int, 
    item_id: int, 
    item_update: ActionItemUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Updates an action item's status, text, or assignee.
    """
    query = select(ActionItem).where(
        ActionItem.id == item_id, 
        ActionItem.meeting_id == meeting_id
    )
    result = await db.execute(query)
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item with ID {item_id} not found for meeting {meeting_id}."
        )
        
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    await db.commit()
    await db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_action_item(
    meeting_id: int, 
    item_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes an action item.
    """
    query = select(ActionItem).where(
        ActionItem.id == item_id, 
        ActionItem.meeting_id == meeting_id
    )
    result = await db.execute(query)
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item with ID {item_id} not found for meeting {meeting_id}."
        )
        
    await db.delete(db_item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
