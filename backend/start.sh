#!/bin/bash
echo "=== Checking database migrations ==="
alembic upgrade head || echo "Alembic migration warning, continuing startup..."

if [ -n "$REDIS_URL" ]; then
    echo "=== Starting Celery worker in background ==="
    celery -A worker.celery_app worker --loglevel=info --concurrency=1 &
fi

echo "=== Starting Uvicorn API server on port ${PORT:-8000} ==="
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
