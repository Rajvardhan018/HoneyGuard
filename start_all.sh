#!/usr/bin/env bash
set -e

echo "============================================================"
echo "HONEYGUARD CYBER INTELLIGENCE PLATFORM - LAUNCHER"
echo "Detect. Deceive. Analyze. Respond."
echo "============================================================"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$DIR/backend:$DIR"

# Start backend
echo "Starting Backend & Sensors..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting React Frontend..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "HoneyGuard is running!"
echo "• Frontend: http://localhost:5173"
echo "• Backend:  http://localhost:8000"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
