import asyncio
import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

# Insert the parent directory of backend/app to system path to resolve imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.models.models import Participant, Meeting, TranscriptSegment, MeetingSummary, Chapter, ActionItem

async def seed_data():
    print("Starting database seeding...")
    
    # Create the engine and session maker
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        async with session.begin():
            # Check if database is already seeded
            result = await session.execute(select(Participant))
            existing_participants = result.scalars().all()
            if existing_participants:
                print("Database already has participants. Skipping seeding to prevent duplication.")
                return

            print("Creating participants...")
            alice = Participant(name="Alice Vance", email="alice@scaler.ai")
            bob = Participant(name="Bob Smith", email="bob@scaler.ai")
            charlie = Participant(name="Charlie Zhang", email="charlie@scaler.ai")
            david = Participant(name="David Miller", email="david@scaler.ai")
            eve = Participant(name="Eve Johnson", email="eve@scaler.ai")
            
            session.add_all([alice, bob, charlie, david, eve])
            await session.flush()  # Flushes to database to populate IDs
            
            print("Creating Meeting 1: Scaler AI Sprint Planning...")
            meeting1 = Meeting(
                title="Scaler AI Sprint Planning & Kickoff",
                date=datetime.utcnow() - timedelta(days=2),
                duration=320,  # 5 mins 20 secs
                audio_url="/audio/sample_meeting_1.wav",  # Path to static folder in Next.js
                participants=[alice, bob, charlie]
            )
            session.add(meeting1)
            await session.flush()
            
            # Transcript segments for Meeting 1
            segments1 = [
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Alice Vance",
                    start_time=0.0,
                    end_time=12.5,
                    text="Hey everyone, thanks for joining today's sprint planning. We have a lot of items to cover, specifically launching the new Fireflies clone dashboard."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Bob Smith",
                    start_time=13.0,
                    end_time=25.2,
                    text="Thanks, Alice. I've finished the initial backend structure using FastAPI and SQLAlchemy. All database tables and models are normalized and migrations are ready."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Charlie Zhang",
                    start_time=26.0,
                    end_time=42.8,
                    text="Excellent. On the frontend, I'll be using Next.js with TypeScript. I plan to build out the dashboard page, meeting library list, and filters by today."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Alice Vance",
                    start_time=43.5,
                    end_time=58.1,
                    text="That sounds great. Bob, can you make sure we have a robust database seed script? The interviewer needs to see the app with sample data immediately upon launch."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Bob Smith",
                    start_time=59.0,
                    end_time=72.0,
                    text="Yes, I am working on that now. I will seed three distinct meetings with full transcripts, timelines, and action items."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Alice Vance",
                    start_time=72.5,
                    end_time=91.4,
                    text="Awesome. Charlie, how are we planning to synchronize the transcript highlight with the audio seek bar? We need to make sure this is highly performant."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Charlie Zhang",
                    start_time=92.0,
                    end_time=122.5,
                    text="I'll create a custom React hook useAudioPlayer that exposes the active segment index based on a timeupdate event from the audio player. When you click a segment, it will update the audio player's currentTime. This keeps it in sync both ways."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Alice Vance",
                    start_time=123.0,
                    end_time=150.0,
                    text="Perfect, let's proceed with that. Let's list the action items. Bob will write the seeding script, and Charlie will build the player sync. I will write the API schemas and review the architecture."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Charlie Zhang",
                    start_time=151.0,
                    end_time=185.0,
                    text="Got it, Alice. I'll also add a search bar inside the transcript to search and highlight keywords. It's a nice core feature to have."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Bob Smith",
                    start_time=186.0,
                    end_time=210.0,
                    text="I will also add the endpoint for LLM-based questions. We can mock it or let users plug in their OpenAI API key if they want to test real dynamic AI notes."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Alice Vance",
                    start_time=211.0,
                    end_time=240.0,
                    text="Brilliant. Let's make sure the code quality is high. Meaningful comments, complete typing annotations, and proper error handling. Let's sync again tomorrow. Bye!"
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Bob Smith",
                    start_time=241.0,
                    end_time=245.0,
                    text="Sounds good. See you tomorrow."
                ),
                TranscriptSegment(
                    meeting_id=meeting1.id,
                    speaker="Charlie Zhang",
                    start_time=246.0,
                    end_time=250.0,
                    text="Thanks, Alice. Bye."
                )
            ]
            session.add_all(segments1)
            
            # Meeting Summary for Meeting 1
            summary1 = MeetingSummary(
                meeting_id=meeting1.id,
                summary_text="The Scaler AI team met to kick off their sprint and align on the Fireflies clone project. Bob Smith has finalized the FastAPI and database skeleton, while Charlie Zhang is initiating the Next.js frontend, focusing on the landing dashboard and interactive transcripts. They discussed technical solutions for audio-transcript seeking and outlined key tasks for the upcoming sprint, emphasizing code quality and comprehensive sample seeding."
            )
            session.add(summary1)
            
            # Chapters for Meeting 1
            chapters1 = [
                Chapter(
                    meeting_id=meeting1.id,
                    title="Introduction and Status Updates",
                    start_time=0.0,
                    summary="Alice Vance introduces the sprint goal. Bob Smith reports backend setup completion, and Charlie Zhang outlines frontend Next.js initialization plans."
                ),
                Chapter(
                    meeting_id=meeting1.id,
                    title="Database Seeding and Data Validation",
                    start_time=43.5,
                    summary="The team discusses the necessity of a rich database seed script so that the app is immediately usable for the interviewer's evaluation."
                ),
                Chapter(
                    meeting_id=meeting1.id,
                    title="Interactive Transcript Synchronization Design",
                    start_time=72.5,
                    summary="Charlie Zhang outlines the implementation details for bi-directional audio sync using a custom React hook, useAudioPlayer."
                ),
                Chapter(
                    meeting_id=meeting1.id,
                    title="Action Item Assignment & Wrap Up",
                    start_time=123.0,
                    summary="Alice Vance summarizes action items, Charlie outlines transcript search highlights, Bob details the dynamic AI chat endpoint, and they conclude the meeting."
                )
            ]
            session.add_all(chapters1)
            
            # Action Items for Meeting 1
            action_items1 = [
                ActionItem(meeting_id=meeting1.id, text="Initialize FastAPI backend and database models", is_completed=True, assigned_to="Bob Smith"),
                ActionItem(meeting_id=meeting1.id, text="Write the database seeding script with full transcripts and action items", is_completed=True, assigned_to="Bob Smith"),
                ActionItem(meeting_id=meeting1.id, text="Design and implement Next.js frontend pages and dashboard UI", is_completed=False, assigned_to="Charlie Zhang"),
                ActionItem(meeting_id=meeting1.id, text="Create useAudioPlayer hook to handle bidirectional seek state", is_completed=False, assigned_to="Charlie Zhang"),
                ActionItem(meeting_id=meeting1.id, text="Write backend OpenAPI endpoints for searching transcripts and exporting files", is_completed=False, assigned_to="Alice Vance")
            ]
            session.add_all(action_items1)

            # Let's seed Meeting 2
            print("Creating Meeting 2: WorkHive Architecture Review...")
            meeting2 = Meeting(
                title="WorkHive Core Architecture & Schema Sync",
                date=datetime.utcnow() - timedelta(days=5),
                duration=165,  # 2 mins 45 secs
                audio_url="/audio/sample_meeting_2.wav",
                participants=[alice, david]
            )
            session.add(meeting2)
            await session.flush()
            
            segments2 = [
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="Alice Vance",
                    start_time=0.0,
                    end_time=15.0,
                    text="Hi David, thanks for jump-starting the WorkHive architecture review. Let's lock down our database schema decisions and migration strategies."
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="David Miller",
                    start_time=15.5,
                    end_time=38.4,
                    text="Absolutely, Alice. I suggest using Alembic for migrations. It handles table adjustments cleanly. In terms of normalization, we definitely need a separate Participant table to avoid repeating strings."
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="Alice Vance",
                    start_time=39.0,
                    end_time=58.2,
                    text="Agreed. That will allow us to easily search and filter meetings by specific participants, which is a core requirement. What about the cascade delete rules?"
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="David Miller",
                    start_time=59.0,
                    end_time=82.5,
                    text="Any child record—like action items, transcript segments, or meeting summaries—must have ondelete='CASCADE' on their foreign keys. If a user deletes a meeting, SQLite should automatically wipe all corresponding details to keep the database clean."
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="Alice Vance",
                    start_time=83.0,
                    end_time=105.0,
                    text="Perfect. Let's make sure we enforce this in our SQLAlchemy model configurations. Also, let's write unit tests verifying that deleting a meeting indeed drops all segments."
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="David Miller",
                    start_time=106.0,
                    end_time=135.0,
                    text="Will do. I will also write a mock AI summarizer. It will accept transcript text and generate bulleted highlights. We can use keyword analysis to pull action items dynamically."
                ),
                TranscriptSegment(
                    meeting_id=meeting2.id,
                    speaker="Alice Vance",
                    start_time=135.5,
                    end_time=165.0,
                    text="Excellent plan, David. Let's run with that. Thanks for your time, let's get building."
                )
            ]
            session.add_all(segments2)
            
            summary2 = MeetingSummary(
                meeting_id=meeting2.id,
                summary_text="Alice Vance and David Miller finalized the database schema and migration architecture for the WorkHive project. They resolved to use Alembic for schema migrations, database-level cascade deletes for relational integrity, and a normalized participant mapping table. David Miller agreed to implement the schema constraints and build a mock AI extraction service to draft notes and summarize transcript files."
            )
            session.add(summary2)
            
            chapters2 = [
                Chapter(
                    meeting_id=meeting2.id,
                    title="Schema Normalization Discussion",
                    start_time=0.0,
                    summary="Alice and David align on database normalization, specifically isolating a Participant table to enable clean participant search indexing."
                ),
                Chapter(
                    meeting_id=meeting2.id,
                    title="Relational Integrity & Cascade Deletes",
                    start_time=59.0,
                    summary="David Miller explains the need for ON DELETE CASCADE on child tables (TranscriptSegment, ActionItem, etc.) to ensure relational integrity in SQLite."
                ),
                Chapter(
                    meeting_id=meeting2.id,
                    title="Summary Extraction & Next Steps",
                    start_time=106.0,
                    summary="David outlines plans for writing tests and designing a dynamic mock AI summarizer using Python keyword matching."
                )
            ]
            session.add_all(chapters2)
            
            action_items2 = [
                ActionItem(meeting_id=meeting2.id, text="Add database foreign key indices and CASCADE triggers", is_completed=True, assigned_to="David Miller"),
                ActionItem(meeting_id=meeting2.id, text="Write Pytest scripts to verify cascading deletes work on Meeting drop", is_completed=False, assigned_to="David Miller"),
                ActionItem(meeting_id=meeting2.id, text="Draft keyword-based AI summary generator class", is_completed=False, assigned_to="David Miller")
            ]
            session.add_all(action_items2)
            
            # Let's seed Meeting 3
            print("Creating Meeting 3: Marketing Weekly Standup...")
            meeting3 = Meeting(
                title="Weekly Marketing Standup & User Growth Initiatives",
                date=datetime.utcnow() - timedelta(days=7),
                duration=180,  # 3 mins
                audio_url="/audio/sample_meeting_3.wav",
                participants=[alice, eve]
            )
            session.add(meeting3)
            await session.flush()
            
            segments3 = [
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Alice Vance",
                    start_time=0.0,
                    end_time=20.0,
                    text="Welcome to the Weekly Marketing Standup. Today we need to talk about scaling user acquisition and setting up our monthly newsletter lists."
                ),
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Eve Johnson",
                    start_time=20.5,
                    end_time=55.0,
                    text="Hey Alice! Yes, the social media campaign is going well. We've seen a 12% click-through-rate increase on Twitter and LinkedIn. However, we're still lagging on organic newsletter signups."
                ),
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Alice Vance",
                    start_time=55.5,
                    end_time=85.0,
                    text="Understood. Let's run a joint webinar next Thursday about utilizing AI for workspace note-taking. That should drive direct newsletter signups. Eve, can you draft the webinar landing page?"
                ),
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Eve Johnson",
                    start_time=85.5,
                    end_time=120.0,
                    text="Sure, I can create the registration form and promotional graphics by Friday. We'll also send an email invite to our existing beta user base."
                ),
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Alice Vance",
                    start_time=120.5,
                    end_time=145.0,
                    text="Great. I'll take care of drafting the slide deck and scheduling the guest speaker. Let's check in on Monday to review the assets."
                ),
                TranscriptSegment(
                    meeting_id=meeting3.id,
                    speaker="Eve Johnson",
                    start_time=145.5,
                    end_time=180.0,
                    text="Perfect. I've logged the action items. See you on Monday!"
                )
            ]
            session.add_all(segments3)
            
            summary3 = MeetingSummary(
                meeting_id=meeting3.id,
                summary_text="Alice Vance and Eve Johnson reviewed weekly marketing achievements, noting a 12% boost in social media CTR. To address slow newsletter signups, they decided to co-host an AI Workspace Note-Taking webinar next Thursday. Eve will construct the landing page registration form and graphics, while Alice coordinates slides and coordinates the guest speaker."
            )
            session.add(summary3)
            
            chapters3 = [
                Chapter(
                    meeting_id=meeting3.id,
                    title="Marketing Stats Review",
                    start_time=0.0,
                    summary="Alice and Eve discuss the recent 12% CTR increase on social media, but note sluggishness in direct newsletter signups."
                ),
                Chapter(
                    meeting_id=meeting3.id,
                    title="Webinar Strategy Proposal",
                    start_time=55.5,
                    summary="Alice proposes holding a joint webinar next Thursday to drive signups. Eve agrees to prepare registrations and social assets."
                ),
                Chapter(
                    meeting_id=meeting3.id,
                    title="Asset Scheduling & Next Sync",
                    start_time=120.5,
                    summary="Alice assigns herself slide creation and speaker coordination, scheduling the next progress review for Monday."
                )
            ]
            session.add_all(chapters3)
            
            action_items3 = [
                ActionItem(meeting_id=meeting3.id, text="Draft landing page and signup forms for the webinar", is_completed=False, assigned_to="Eve Johnson"),
                ActionItem(meeting_id=meeting3.id, text="Create social media promotional graphics for webinar promotion", is_completed=False, assigned_to="Eve Johnson"),
                ActionItem(meeting_id=meeting3.id, text="Draft presentation deck and invite guest speaker", is_completed=False, assigned_to="Alice Vance")
            ]
            session.add_all(action_items3)

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
