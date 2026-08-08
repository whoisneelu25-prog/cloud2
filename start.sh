#!/bin/bash

# CareFlow Clinic Queue Management System Startup Script
echo "============================================="
echo " Starting CareFlow Clinic Queue System"
echo "============================================="

# Get the script directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start Backend Server
echo "Starting Backend API (FastAPI) on http://127.0.0.1:8000..."
cd "$ROOT_DIR"
./backend/venv/bin/python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend Dev Server
echo "Starting Frontend UI (Vite) on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to kill both background processes
trap "echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo ""
echo "--------------------------------------------------------"
echo " Application is running!"
echo " Frontend : http://localhost:5173"
echo " Backend  : http://127.0.0.1:8000/docs"
echo " Database : MySQL (clinic_queue)"
echo "--------------------------------------------------------"
echo "Press Ctrl+C to stop both servers anytime."
echo ""

# Wait for both processes
wait
