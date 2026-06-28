# 🚀 Vrital — AI Virtual Try-On Fashion Platform

A production-grade full-stack platform combining e-commerce (Amazon/Zara style) with AI virtual try-on.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + Zustand |
| Admin Panel | React 18 + Vite + Recharts + React Hook Form |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| AI | External inference service (mock in dev) |

## Quick Start (Docker)

```bash
# 1. Clone & enter project
cd vrital_web

# 2. Start backend + DB + Redis
docker-compose up --build -d

# 3. Run database migrations
docker-compose exec backend alembic upgrade head

# 4. Seed sample data + admin user
docker-compose exec backend python seed.py

# 5. Install & run customer frontend (new terminal)
cd frontend && npm install && npm run dev
# → http://localhost:5173

# 6. Install & run admin panel (new terminal)
cd admin && npm install && npm run dev
# → http://localhost:5174/admin
```

## Default Credentials

| Role | Email | Password | URL |
|---|---|---|---|
| Admin | admin@vrital.com | admin123 | http://localhost:5174/admin |
| Customer | Register at | — | http://localhost:5173/login |

## API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/

## Project Structure

```
vrital_web/
├── frontend/          # Customer React app (port 5173)
├── admin/             # Admin React app (port 5174)
├── backend/           # FastAPI backend (port 8000)
│   ├── app/
│   │   ├── modules/   # auth, products, tryon, users, orders
│   │   ├── services/  # ai_client, s3
│   │   └── core/      # config, security, db
│   ├── alembic/       # DB migrations
│   └── seed.py        # Sample data
└── docker-compose.yml
```

## AI Try-On

The AI try-on system operates under a priority-based routing gateway:

1. **Priority 1: Nano Banana 2 (Google Gemini 3.1 Flash Image API)**
   - Triggered by configuring `GEMINI_API_KEY` or `NANO_BANANA_API_KEY` in `backend/.env`.
   - Uses advanced multimodal inpainting to render the garment onto the person.
2. **Priority 2: IDM-VTON**
   - **Cloud Replicate:** Enabled by setting `REPLICATE_API_TOKEN` in `backend/.env`.
   - **Local Bridge Server:** Enabled by running `idm_vton_server.py` at `http://localhost:8001` (configured via `AI_SERVICE_URL`).
3. **Priority 3: Local Fallback (Segment-and-Drape)**
   - Used automatically when no API keys or local bridge servers are available (dev fallback).

Set the respective environment variables in `backend/.env` to configure your preferred generation pipeline.
