# SmartMeet MVP

Meeting intelligence platform that transforms audio recordings and transcripts into actionable insights.

## Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: PostgreSQL + pgvector
- **Queue**: Redis + Celery
- **Storage**: S3-compatible (Supabase)
- **AI**: OpenAI (GPT-4 + Whisper)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local dev)
- Python 3.11+ (for local dev)

### Using Docker (Recommended)

```bash
# Clone and setup
git clone <repo-url>
cd smartmeet

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Configure your .env

# Start PostgreSQL and Redis (or use Docker)
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload --port 8000

# Start worker (in separate terminal)
celery -A app.workers worker --loglevel=info
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Configure your .env
npm run dev
```

## Features

- **Audio Upload**: Upload MP3, WAV, M4A files
- **Transcript Upload**: Upload TXT, DOCX, PDF or paste text
- **AI Analysis**: Automatic extraction of summary, decisions, action items, topics, and risks
- **Ask AI**: Chat with your meeting using source-grounded answers
- **Follow-Up Generator**: Generate professional follow-up emails
- **Search**: Find meetings, decisions, and action items

## Environment Variables

See `.env.example` files in both frontend and backend directories.

## Project Structure

```
smartmeet/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/       # Pages
│   │   ├── components # UI components
│   │   ├── lib/       # API client, utilities
│   │   └── types/     # TypeScript types
│   └── ...
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── models/    # Database models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── workers/   # Celery tasks
│   └── alembic/       # Migrations
└── docker-compose.yml
```

## License

MIT
