#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Running database migrations ==="
alembic upgrade head

echo "=== Starting Celery worker in background (concurrency=1) ==="
# Concurrency 1 is critical on Render free tier to keep RAM usage under 512MB
celery -A worker.celery_app worker --loglevel=info --concurrency=1 &

echo "=== Starting Uvicorn API server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
