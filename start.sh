#!/usr/bin/env bash
echo "========================================================"
echo "       Starting Surplus to Share (FoodLink) Locally"
echo "========================================================"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend in background
cd "$ROOT_DIR/backend" || exit 1
python3 server.py &
BACKEND_PID=$!

sleep 2

# Start frontend in background
cd "$ROOT_DIR/frontend" || exit 1
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "========================================================"
echo "Application is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8001"
echo "API Docs: http://localhost:8001/api/docs"
echo "========================================================"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
