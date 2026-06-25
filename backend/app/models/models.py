from datetime import datetime
from typing import List, Optional
from sqlalchemy import ForeignKey, Table, Column, Integer, Float, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

# Many-to-Many Association Table between Meetings and Participants
meeting_participant_association = Table(
    "meeting_participant",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meeting.id", ondelete="CASCADE"), primary_key=True),
    Column("participant_id", Integer, ForeignKey("participant.id", ondelete="CASCADE"), primary_key=True),
)

class Participant(Base):
    __tablename__ = "participant"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    # Relationships
    meetings: Mapped[List["Meeting"]] = relationship(
        secondary=meeting_participant_association,
        back_populates="participants"
    )


class Meeting(Base):
    __tablename__ = "meeting"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, default=0)  # In seconds
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participants: Mapped[List[Participant]] = relationship(
        secondary=meeting_participant_association,
        back_populates="meetings",
        lazy="selectin"
    )
    transcript_segments: Mapped[List["TranscriptSegment"]] = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    summary: Mapped[Optional["MeetingSummary"]] = relationship(
        "MeetingSummary",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    chapters: Mapped[List["Chapter"]] = relationship(
        "Chapter",
        back_populates="meeting",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    action_items: Mapped[List["ActionItem"]] = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meeting.id", ondelete="CASCADE"), index=True, nullable=False)
    speaker: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)  # Time in seconds
    end_time: Mapped[float] = mapped_column(Float, nullable=False)    # Time in seconds
    text: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    meeting: Mapped[Meeting] = relationship(back_populates="transcript_segments")


class MeetingSummary(Base):
    __tablename__ = "meeting_summary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meeting.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    meeting: Mapped[Meeting] = relationship(back_populates="summary")


class Chapter(Base):
    __tablename__ = "chapter"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meeting.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)  # Section start timestamp
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    meeting: Mapped[Meeting] = relationship(back_populates="chapters")


class ActionItem(Base):
    __tablename__ = "action_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meeting.id", ondelete="CASCADE"), index=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    meeting: Mapped[Meeting] = relationship(back_populates="action_items")
