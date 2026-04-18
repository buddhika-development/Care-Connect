#!/bin/bash
set -e

echo "Waiting for database to be ready..."
sleep 3

echo "Running migrations..."
uv run alembic upgrade head

echo "Starting server..."
exec uv run uvicorn main:app --host 0.0.0.0 --port 8002
