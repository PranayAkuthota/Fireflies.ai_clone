# Fireflies.ai Clone - Meeting Notes & Transcription Platform

A production-grade, interactive meeting assistant workspace clone built as a Software Engineering Internship assignment for Scaler AI Labs.

This platform replicates the design, user experience, and core post-meeting workflows of Fireflies.ai. It includes a comprehensive meetings library dashboard, bidirectional player-transcript seek syncing, keyword-based AI summaries, chapter outlining, checklist action items CRUD, and an interactive "Ask Fred" transcript-based AI chat bot.

---

## 1. Technical Stack

- **Frontend**: Next.js 15 (TypeScript, React 19, Tailwind CSS v4, Lucide React Icons).
- **Backend**: Python 3 (FastAPI, Uvicorn, SQLAlchemy 2.0 Async, Pydantic v2).
- **Database**: SQLite (managed with asynchronous connections via `aiosqlite`).
- **Migrations**: Alembic.

---

## 2. Architectural Overview

The application is split into two completely decoupled systems interacting via standard RESTful JSON interfaces:

```
+------------------------------------+
|         Next.js Frontend           |
| (Interactive Player, Context State)|
+------------------+-----------------+
                   | HTTP REST (CORS)
                   v
+------------------+-----------------+
|         FastAPI Backend            |
| (API Routers, Async Dependency DI) |
+------------------+-----------------+
                   | SQLAlchemy ORM
                   v
+------------------+-----------------+
|          SQLite Database           |
|  (Normalized relational models)    |
+------------------------------------+
```

### Key Design Decisions
1. **Bidirectional Seek State (ActiveMeetingContext)**:
   Instead of coupling the media player and transcript tightly (which causes performance-sapping re-renders during playback `timeupdate` events), we created a React Context (`ActiveMeetingContext`). 
   - Playback `currentTime` is written by the `<AudioPlayer>` and read by transcript segments to highlight the active sentence.
   - Segment click events invoke `seekTo(timestamp)` which updates a `triggerSeekTime` variable. The player monitors this trigger via a `useEffect` hook to seek the underlying audio tag, keeping operations fully performant.
2. **Asynchronous Session Lifetimes (`get_db`)**:
   FastAPI handles connections asynchronously using SQLAlchemy `AsyncSession`. Our dependency injector `get_db` handles session opening and automatically guarantees session closure via a `try...finally` block.
3. **Keyword-Based AI Service (`AIService`)**:
   When new transcripts are pasted or uploaded as files, the backend parses dialogue markers, calculates start/end times relative to word count (to simulate natural speaking pacing), and runs semantic rule-based keyword match algorithms to synthesize the meeting summary, outline chapters, and extract action items.

---

## 3. Database Schema

The SQLite schema is normalized to ensure referential integrity. All foreign keys referencing the `meeting` table include `ON DELETE CASCADE` constraints so that dropping a meeting automatically clears transcripts, summaries, and tasks.

```
                  +-----------------------+
                  |        Meeting        |
                  +-----------------------+
                  | id (PK)               |
                  | title (VARCHAR)       |
                  | date (DATETIME)       |
                  | duration (INTEGER)    |
                  | audio_url (VARCHAR)   |
                  +-----------+-----------+
                              |
       +----------------------+----------------------+----------------------+
       | 1                    | 1                    | 1                    | 1
       v 0..*                 v 0..1                 v 0..*                 v 0..*
+------+------+       +-------+-------+       +------+------+       +------+------+
| Transcript  |       |    Meeting    |       |   Chapter   |       | ActionItem  |
|   Segment   |       |    Summary    |       +-------------+       +-------------+
+-------------+       +---------------+       | id (PK)     |       | id (PK)     |
| id (PK)     |       | id (PK)       |       | title       |       | text        |
| speaker     |       | summary_text  |       | start_time  |       | is_complete |
| start_time  |       +---------------+       | summary     |       | assigned_to |
| end_time    |                               +-------------+       +-------------+
| text        |
+-------------+
```

*Note: Meetings and Participants share a many-to-many relationship mapped via the `meeting_participant` association table, allowing clean querying and indexing.*

---

## 4. API Documentation (REST endpoints)

All endpoints are hosted at `http://127.0.0.1:8001/api/v1`. Interactive Swagger documentation is viewable at `http://127.0.0.1:8001/docs`.

### Meetings
- `GET /meetings`: List meetings with filters (`q` for search, `participant_id`, `date_start`, `date_end`) and sorting (`sort_by`).
- `GET /meetings/{id}`: Detailed view of a meeting with joins.
- `POST /meetings`: Creates a meeting (accepts participants list and transcript text).
- `PATCH /meetings/{id}`: Edit meeting title.
- `DELETE /meetings/{id}`: Cascade deletes meeting and relations.
- `GET /meetings/{id}/export`: Exports transcript as a formatted Markdown file download.
- `POST /meetings/{id}/ask`: Contextual Q&A endpoint for searching transcript segments and action items.

### Action Items
- `POST /meetings/{meeting_id}/action-items`: Append a new action item task.
- `PATCH /meetings/{meeting_id}/action-items/{item_id}`: Toggle completed state, modify description, or update assignee.
- `DELETE /meetings/{meeting_id}/action-items/{item_id}`: Delete task.

### Participants
- `GET /participants`: Retrieve list of all unique participant profiles.

---

## 5. Local Setup Instructions

Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### Step 1: Run the Backend API Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run Alembic migrations to construct SQLite tables:
   ```bash
   alembic upgrade head
   ```
5. Populate the database with sample meeting seeds:
   ```bash
   python3 app/seed.py
   ```
6. Launch the development server on port `8001`:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8001
   ```

### Step 2: Run the Frontend Next.js Client
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser to access the Fireflies workspace dashboard.

---

## 6. Self-Study Guide for Your Interview

To explain this project confidently to interviewers, make sure you understand the following:

- **What happens when you click a transcript line?**
  1. The clicked segment fires an `onClick` callback that extracts the segment's `start_time` (e.g. `26.0` seconds).
  2. The segment calls `seekTo(26.0)` from our custom hook `useActiveMeeting()`.
  3. Under the hood, this sets `triggerSeekTime = 26.0` in the shared React Context.
  4. The `<AudioPlayer>` has a `useEffect` hook listening to `triggerSeekTime`. When it changes, it updates the HTML5 `<audio>` element's cursor: `audioRef.current.currentTime = 26.0` and clears the trigger state to prevent loops.
  
- **How does the active transcript highlight scroll into view?**
  The `<TranscriptPanel>` listens to changes in the player's current playback position. If a segment's start and end times envelop `currentTime`, its segment ID is set as active. A React ref map resolves that segment's DOM container and calls `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` automatically.
  
- **What is the advantage of Async SQLite connections?**
  SQLite normally locks databases during writes. By utilizing `aiosqlite` with SQLAlchemy's `create_async_engine`, we handle queries asynchronously, allowing the thread pool to execute operations concurrently without blocking the main event loop.
