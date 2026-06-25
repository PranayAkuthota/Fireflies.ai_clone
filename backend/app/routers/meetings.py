from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete

from app.core.database import get_db
from app.models.models import Meeting, Participant, TranscriptSegment, MeetingSummary, Chapter, ActionItem
from app.schemas.schemas import MeetingListResponse, MeetingDetailResponse, MeetingCreate, MeetingUpdate, ActionItemResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/meetings", tags=["meetings"])

@router.get("", response_model=List[MeetingListResponse])
async def list_meetings(
    q: Optional[str] = Query(None, description="Search meetings by title"),
    participant_id: Optional[int] = Query(None, description="Filter by participant ID"),
    date_start: Optional[datetime] = Query(None, description="Filter by start date"),
    date_end: Optional[datetime] = Query(None, description="Filter by end date"),
    sort_by: str = Query("date_desc", description="Sort criteria: date_desc, date_asc, duration_desc, duration_asc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists meetings with support for title queries, participant filtering, date ranges, and sorting.
    """
    query = select(Meeting).options(selectinload(Meeting.participants))
    
    # Filter by text search
    if q:
        query = query.where(Meeting.title.ilike(f"%{q}%"))
        
    # Filter by participant association
    if participant_id:
        query = query.join(Meeting.participants).where(Participant.id == participant_id)
        
    # Filter by date ranges
    if date_start:
        query = query.where(Meeting.date >= date_start)
    if date_end:
        query = query.where(Meeting.date <= date_end)
        
    # Apply sorting
    if sort_by == "date_asc":
        query = query.order_by(Meeting.date.asc())
    elif sort_by == "duration_desc":
        query = query.order_by(Meeting.duration.desc())
    elif sort_by == "duration_asc":
        query = query.order_by(Meeting.duration.asc())
    else:  # default date_desc (recency)
        query = query.order_by(Meeting.date.desc())
        
    # Prevent duplicates when joining tables
    query = query.distinct()
    
    result = await db.execute(query)
    meetings = result.scalars().all()
    return meetings


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting(meeting_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieves full details of a specific meeting, joining transcripts, summaries, chapters, action items, and participants.
    """
    query = (
        select(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.transcript_segments),
            selectinload(Meeting.summary),
            selectinload(Meeting.chapters),
            selectinload(Meeting.action_items),
        )
        .where(Meeting.id == meeting_id)
    )
    result = await db.execute(query)
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found."
        )
    return meeting


@router.post("", response_model=MeetingDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(meeting_data: MeetingCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates a new meeting record.
    If transcript_text is provided, it is parsed into segments, and AI summaries/chapters/action items are dynamically generated.
    """
    # 1. Resolve or create participants
    db_participants = []
    for participant in meeting_data.participants:
        p_query = select(Participant).where(Participant.email == participant.email)
        p_result = await db.execute(p_query)
        db_p = p_result.scalar_one_or_none()
        if not db_p:
            db_p = Participant(name=participant.name, email=participant.email)
            db.add(db_p)
            await db.flush()
        db_participants.append(db_p)
        
    # 2. Build segments if transcript is attached
    parsed_segments = []
    duration = 0
    if meeting_data.transcript_text:
        parsed_segments = AIService.parse_transcript_text(meeting_data.transcript_text)
        if parsed_segments:
            duration = int(parsed_segments[-1].end_time)
            
    # 3. Create the meeting object
    new_meeting = Meeting(
        title=meeting_data.title,
        date=meeting_data.date or datetime.utcnow(),
        duration=duration,
        audio_url="/audio/sample_meeting_1.wav",  # default mock audio asset
        participants=db_participants
    )
    db.add(new_meeting)
    await db.flush()  # Populates new_meeting.id
    
    # 4. Save segments and generate AI notes
    if parsed_segments:
        # Save transcript segments
        for seg in parsed_segments:
            db_seg = TranscriptSegment(
                meeting_id=new_meeting.id,
                speaker=seg.speaker,
                start_time=seg.start_time,
                end_time=seg.end_time,
                text=seg.text
            )
            db.add(db_seg)
            
        # Run AI Service notes generators
        p_names = [p.name for p in db_participants]
        ai_summary, ai_chapters, ai_actions = AIService.generate_ai_notes(
            title=new_meeting.title,
            segments=parsed_segments,
            participants=p_names
        )
        
        # Save Meeting Summary
        db_summary = MeetingSummary(
            meeting_id=new_meeting.id,
            summary_text=ai_summary.summary_text
        )
        db.add(db_summary)
        
        # Save Chapters
        for ch in ai_chapters:
            db_ch = Chapter(
                meeting_id=new_meeting.id,
                title=ch.title,
                start_time=ch.start_time,
                summary=ch.summary
            )
            db.add(db_ch)
            
        # Save Action Items
        for act in ai_actions:
            db_act = ActionItem(
                meeting_id=new_meeting.id,
                text=act.text,
                is_completed=act.is_completed,
                assigned_to=act.assigned_to
            )
            db.add(db_act)
            
    else:
        # Create empty summary fallback if no transcript text
        db_summary = MeetingSummary(
            meeting_id=new_meeting.id,
            summary_text="No transcript was provided to generate notes."
        )
        db.add(db_summary)
        
    await db.commit()
    
    # Refresh to fetch loaded relationships
    return await get_meeting(new_meeting.id, db)


@router.patch("/{meeting_id}", response_model=MeetingDetailResponse)
async def update_meeting(meeting_id: int, meeting_update: MeetingUpdate, db: AsyncSession = Depends(get_db)):
    """
    Updates meeting metadata (title, date, participants).
    """
    # Use selectinload to eagerly load participants so we can update them safely
    query = select(Meeting).options(selectinload(Meeting.participants)).where(Meeting.id == meeting_id)
    result = await db.execute(query)
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found."
        )
        
    update_data = meeting_update.model_dump(exclude_unset=True)
    
    # Handle participants separately if they are being updated
    if "participants" in update_data:
        participants_data = update_data.pop("participants")
        db_participants = []
        for participant in participants_data:
            p_query = select(Participant).where(Participant.email == participant["email"])
            p_result = await db.execute(p_query)
            db_p = p_result.scalar_one_or_none()
            if not db_p:
                db_p = Participant(name=participant["name"], email=participant["email"])
                db.add(db_p)
                await db.flush()
            db_participants.append(db_p)
        meeting.participants = db_participants

    for key, value in update_data.items():
        setattr(meeting, key, value)
        
    await db.commit()
    return await get_meeting(meeting_id, db)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(meeting_id: int, db: AsyncSession = Depends(get_db)):
    """
    Deletes a meeting. Cascading foreign keys will clear transcript, chapters, summary, and action items.
    """
    meeting = await db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found."
        )
        
    await db.delete(meeting)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{meeting_id}/ask")
async def ask_meeting_question(meeting_id: int, request_body: dict, db: AsyncSession = Depends(get_db)):
    """
    Endpoint for asking AI questions about the meeting.
    Performs transcript contextual parsing to answer queries dynamically.
    """
    question = request_body.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")
        
    # Get transcript segments to build context
    query = select(TranscriptSegment).where(TranscriptSegment.meeting_id == meeting_id)
    result = await db.execute(query)
    segments = result.scalars().all()
    
    if not segments:
        return {"answer": "This meeting has no transcript data available to query."}
        
    context_text = " ".join([f"{s.speaker}: {s.text}" for s in segments])
    q_lower = question.lower()
    
    # Custom keyword matching to respond intelligently based on transcript context
    if "action item" in q_lower or "todo" in q_lower or "task" in q_lower:
        ai_query = select(ActionItem).where(ActionItem.meeting_id == meeting_id)
        ai_result = await db.execute(ai_query)
        actions = ai_result.scalars().all()
        if actions:
            action_list = "\n".join([f"- [ ] {a.text} (Assigned: {a.assigned_to or 'Unassigned'})" for a in actions])
            return {"answer": f"Here are the action items identified in this meeting:\n{action_list}"}
        return {"answer": "No action items were listed in this meeting."}
        
    if "who" in q_lower or "participant" in q_lower or "speaker" in q_lower:
        speakers = list(set([s.speaker for s in segments]))
        return {"answer": f"The participants speaking in this meeting are: {', '.join(speakers)}."}
        
    # Custom text searches
    matched_sentences = []
    for s in segments:
        # Check if query words overlap with segment text
        words = q_lower.split()
        # look for matching concepts
        if any(w in s.text.lower() for w in words if len(w) > 4):
            matched_sentences.append(f"{s.speaker} said: '{s.text}'")
            
    if matched_sentences:
        snippet = "\n".join(matched_sentences[:3])
        return {
            "answer": f"Based on the transcript context, here are relevant moments discussed:\n{snippet}\n\nIs there anything specific you would like me to detail further?"
        }
        
    return {
        "answer": f"I analyzed the meeting transcript. They discussed various topics, but I couldn't find a direct answer to '{question}'. Could you rephrase your question, perhaps mentioning specific keywords like sprint, database, or API?"
    }


@router.get("/{meeting_id}/export")
async def export_meeting_transcript(meeting_id: int, db: AsyncSession = Depends(get_db)):
    """
    Exports transcript as a clean, formatted markdown string.
    """
    meeting_query = select(Meeting).where(Meeting.id == meeting_id)
    meeting_result = await db.execute(meeting_query)
    meeting = meeting_result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    segments_query = select(TranscriptSegment).where(TranscriptSegment.meeting_id == meeting_id).order_by(TranscriptSegment.start_time.asc())
    segments_result = await db.execute(segments_query)
    segments = segments_result.scalars().all()
    
    # Build markdown transcript content
    lines = [f"# Transcript: {meeting.title}", f"Date: {meeting.date.strftime('%Y-%m-%d %H:%M:%S')}\n"]
    for s in segments:
        m, s_sec = divmod(int(s.start_time), 60)
        time_str = f"{m:02d}:{s_sec:02d}"
        lines.append(f"**[{time_str}] {s.speaker}**: {s.text}\n")
        
    md_content = "\n".join(lines)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=meeting_{meeting_id}_transcript.md"}
    )
