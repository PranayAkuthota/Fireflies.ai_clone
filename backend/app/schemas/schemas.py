from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict

# Participant Schemas
class ParticipantBase(BaseModel):
    name: str
    email: str  # Kept as str to prevent email format restrictions if seeding mock names

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantResponse(ParticipantBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Transcript Segment Schemas
class TranscriptSegmentBase(BaseModel):
    speaker: str
    start_time: float
    end_time: float
    text: str

class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass

class TranscriptSegmentResponse(TranscriptSegmentBase):
    id: int
    meeting_id: int
    
    model_config = ConfigDict(from_attributes=True)


# Summary Schemas
class MeetingSummaryBase(BaseModel):
    summary_text: str

class MeetingSummaryCreate(MeetingSummaryBase):
    pass

class MeetingSummaryResponse(MeetingSummaryBase):
    id: int
    meeting_id: int
    
    model_config = ConfigDict(from_attributes=True)


# Chapter Schemas
class ChapterBase(BaseModel):
    title: str
    start_time: float
    summary: str

class ChapterCreate(ChapterBase):
    pass

class ChapterResponse(ChapterBase):
    id: int
    meeting_id: int
    
    model_config = ConfigDict(from_attributes=True)


# Action Item Schemas
class ActionItemBase(BaseModel):
    text: str
    is_completed: bool = False
    assigned_to: Optional[str] = None

class ActionItemCreate(ActionItemBase):
    pass

class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    is_completed: Optional[bool] = None
    assigned_to: Optional[str] = None

class ActionItemResponse(ActionItemBase):
    id: int
    meeting_id: int
    
    model_config = ConfigDict(from_attributes=True)


# Meeting Schemas
class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration: int
    audio_url: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    date: Optional[datetime] = None
    participants: List[ParticipantCreate] = []
    # Allows pasting/uploading transcript text directly
    transcript_text: Optional[str] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    participants: Optional[List[ParticipantCreate]] = None

class MeetingListResponse(MeetingBase):
    id: int
    participants: List[ParticipantResponse]
    
    model_config = ConfigDict(from_attributes=True)

class MeetingDetailResponse(MeetingBase):
    id: int
    participants: List[ParticipantResponse]
    transcript_segments: List[TranscriptSegmentResponse]
    summary: Optional[MeetingSummaryResponse] = None
    chapters: List[ChapterResponse]
    action_items: List[ActionItemResponse]
    
    model_config = ConfigDict(from_attributes=True)
