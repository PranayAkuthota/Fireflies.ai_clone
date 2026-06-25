import re
from typing import List, Dict, Any, Tuple
from app.schemas.schemas import TranscriptSegmentCreate, MeetingSummaryCreate, ChapterCreate, ActionItemCreate

class AIService:
    @staticmethod
    def parse_transcript_text(text: str) -> List[TranscriptSegmentCreate]:
        """
        Parses raw text transcripts.
        Supports patterns:
        - "[00:12] Speaker Name: Segment text"
        - "Speaker Name: Segment text"
        - Standard paragraph lines.
        """
        segments = []
        lines = text.strip().split("\n")
        current_time = 0.0
        
        # Regex patterns
        time_speaker_pattern = re.compile(r"^\[(\d{1,2}):(\d{2})\]\s*([^:]+):\s*(.*)$")
        speaker_only_pattern = re.compile(r"^([^:]+):\s*(.*)$")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            time_match = time_speaker_pattern.match(line)
            if time_match:
                mins, secs, speaker, content = time_match.groups()
                start_time = float(int(mins) * 60 + int(secs))
                duration = len(content.split()) * 0.4  # Estimate duration based on word count
                end_time = start_time + max(2.0, duration)
                current_time = end_time
                
                segments.append(TranscriptSegmentCreate(
                    speaker=speaker.strip(),
                    start_time=start_time,
                    end_time=end_time,
                    text=content.strip()
                ))
                continue
                
            speaker_match = speaker_only_pattern.match(line)
            if speaker_match:
                speaker, content = speaker_match.groups()
                start_time = current_time
                duration = len(content.split()) * 0.4
                end_time = start_time + max(2.0, duration)
                current_time = end_time + 1.0  # Add small gap
                
                segments.append(TranscriptSegmentCreate(
                    speaker=speaker.strip(),
                    start_time=start_time,
                    end_time=end_time,
                    text=content.strip()
                ))
                continue
            
            # Fallback for plain lines
            start_time = current_time
            duration = len(line.split()) * 0.4
            end_time = start_time + max(2.0, duration)
            current_time = end_time + 1.0
            
            segments.append(TranscriptSegmentCreate(
                speaker="Unknown",
                start_time=start_time,
                end_time=end_time,
                text=line
            ))
            
        return segments

    @staticmethod
    def generate_ai_notes(
        title: str, 
        segments: List[TranscriptSegmentCreate],
        participants: List[str]
    ) -> Tuple[MeetingSummaryCreate, List[ChapterCreate], List[ActionItemCreate]]:
        """
        Generates dynamic summaries, chapters, and action items from transcript segments.
        Uses keyword-matching and temporal-grouping to simulate an advanced LLM response.
        """
        if not segments:
            # Empty transcript fallbacks
            summary = MeetingSummaryCreate(summary_text=f"This meeting, titled '{title}', had no transcript segments to summarize.")
            return summary, [], []
            
        full_text = " ".join([seg.text for seg in segments])
        total_duration = segments[-1].end_time if segments else 0.0
        
        # 1. Generate Summary
        summary_paragraphs = []
        summary_paragraphs.append(
            f"The meeting titled '{title}' brought together participants to discuss project updates and key actions."
        )
        
        # Keyword-based details
        keywords = {
            "sprint": "sprint cycles, active developmental tasks, and scheduling milestones",
            "database": "database architecture, tables optimization, migrations and normalization",
            "api": "RESTful endpoints design, router structure, type validation, and server integrations",
            "frontend": "Next.js pages layout, dashboard components, user experience, and visual styling",
            "marketing": "marketing initiatives, organic acquisition, growth trends, and webinar outreach",
            "sync": "operational synchronization, workflow efficiency, and team communication channels",
        }
        
        found_details = []
        for kw, desc in keywords.items():
            if kw in full_text.lower() or kw in title.lower():
                found_details.append(desc)
                
        if found_details:
            summary_paragraphs.append(
                f"Core conversation points revolved around {', '.join(found_details[:-1])} and {found_details[-1]}." if len(found_details) > 1 else f"Core conversation points revolved around {found_details[0]}."
            )
        else:
            summary_paragraphs.append(
                "The conversation covered general status updates, aligning objectives, and defining action points for the upcoming week."
            )
            
        summary_paragraphs.append(
            f"The team finalized specific tasks and assigned responsibilities to ensure smooth execution, planning to sync on progress soon."
        )
        
        meeting_summary = MeetingSummaryCreate(summary_text=" ".join(summary_paragraphs))
        
        # 2. Generate Chapters (Split meeting timeline into 3 sections)
        chapters = []
        num_segs = len(segments)
        
        if num_segs >= 3:
            chunk1_end = num_segs // 3
            chunk2_end = chunk1_end * 2
            
            chunks = [
                (segments[0 : chunk1_end], "Introduction and Kickoff"),
                (segments[chunk1_end : chunk2_end], "Roadmap & Detailed Discussion"),
                (segments[chunk2_end : ], "Action Items & Conclusion")
            ]
        else:
            chunks = [(segments, "Main Discussion")]
            
        for chunk_segs, default_title in chunks:
            if not chunk_segs:
                continue
            start_t = chunk_segs[0].start_time
            chunk_text = " ".join([s.text for s in chunk_segs])
            
            # Derive title from words in chunk
            c_title = default_title
            if "sprint" in chunk_text.lower():
                c_title = "Sprint & Task Planning"
            elif "database" in chunk_text.lower() or "schema" in chunk_text.lower():
                c_title = "Database & Relational Schema"
            elif "api" in chunk_text.lower() or "backend" in chunk_text.lower():
                c_title = "Backend APIs and Routes"
            elif "marketing" in chunk_text.lower() or "webinar" in chunk_text.lower():
                c_title = "Marketing Strategy & Operations"
                
            # Short summary of chunk text
            words = chunk_text.split()
            c_summary = " ".join(words[:25]) + "..." if len(words) > 25 else chunk_text
            
            chapters.append(ChapterCreate(
                title=c_title,
                start_time=start_t,
                summary=c_summary
            ))
            
        # 3. Extract Action Items
        action_items = []
        action_triggers = [
            r"(?:i|we|you)\s+will\s+([\w\s]{10,80})",
            r"(?:can\s+you|please)\s+([\w\s]{10,80})",
            r"need\s+to\s+([\w\s]{10,80})",
            r"should\s+([\w\s]{10,80})",
            r"action\s+item\s*(?:is)?:\s*([\w\s]{10,80})"
        ]
        
        for seg in segments:
            for trigger in action_triggers:
                matches = re.findall(trigger, seg.text, re.IGNORECASE)
                for match in matches:
                    text_candidate = match.strip().capitalize()
                    # Clean up trailing punctuation / pronouns
                    text_candidate = re.sub(r'\s+(?:by|on|next)\s+\w+.*$', '', text_candidate) # Strip date qualifiers for clean task text
                    
                    # Associate with speaker if they are in participants
                    assignee = seg.speaker if seg.speaker != "Unknown" else None
                    
                    # Add task if not duplicate
                    if not any(a.text.lower() == text_candidate.lower() for a in action_items):
                        action_items.append(ActionItemCreate(
                            text=text_candidate,
                            is_completed=False,
                            assigned_to=assignee
                        ))
                        
        # Fallback if no action items found
        if not action_items:
            for p in participants[:2]:
                action_items.append(ActionItemCreate(
                    text=f"Follow up on {title} objectives and check updates",
                    is_completed=False,
                    assigned_to=p
                ))
                
        return meeting_summary, chapters, action_items
