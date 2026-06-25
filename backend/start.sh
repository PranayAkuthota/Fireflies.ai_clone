#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Running database seed script..."
python -m app.seed

echo "Starting FastAPI server..."
export PORT=${PORT:-10000}
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
