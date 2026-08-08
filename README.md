# CareFlow - Clinic Queue Management System 🏥⚡

A modern, full-stack Clinic Queue Management and Real-Time Patient Orchestration system built with **FastAPI**, **MySQL (SQLAlchemy ORM)**, and **React + Vite**.

Designed for busy clinics and outpatient departments to streamline patient registration, prioritize token allocation, manage doctor consultations, and broadcast live waiting room displays with voice announcements.

---

## 🌟 Key Features

1. **Executive Dashboard**:
   - Live metrics on waiting patients, active consultations, completed visits, and total registrations.
   - Real-time doctor room status matrix and instant token issuance.
   - Quick one-click sample seed data generator.

2. **Live Waiting Room TV Display (`Live Board`)**:
   - Fullscreen public display optimized for waiting area TV monitors.
   - Real-time "Now Serving" counter with doctor assignments and consultation rooms.
   - Multi-voice audio synthesizer & chime alerts when next patient is called.
   - Doctor filter for department-specific displays.

3. **Reception Queue Manager**:
   - Live queue list with priorities (`Normal`, `Urgent`, `Emergency`).
   - Reorder, prioritize, transfer, or cancel tokens on the fly.
   - Instant token printing / digital slip preview.

4. **Doctor Consultation Station**:
   - Room-specific portal for doctors to call the next patient, view vital notes, prescribe treatments, and mark visits complete.
   - One-click status toggling (`Available`, `Busy`, `Break`, `Offline`).

5. **Patient Directory & Registration**:
   - Patient Medical Record Number (MRN) indexing.
   - Full patient history, contact records (Indian format `+91`), and search by name/MRN/phone.

6. **Doctor & Room Administration**:
   - Manage doctor rosters, room assignments, daily token quotas, and active shifts.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla Modern CSS with Glassmorphism & Micro-animations, Web Speech API for voice calls.
- **Backend**: FastAPI (Python 3.10+ / 3.14), SQLAlchemy ORM, Pydantic v2, Uvicorn ASGI Server.
- **Database**: MySQL 8.0+ / 9.0+ with connection pooling and automated migration/initialization.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Virtual environment included in `./backend/venv`)
- **Node.js 18+** & `npm`
- **MySQL Server** running locally on port `3306`

### 2. Configure Backend Database
Create the `.env` file in `./backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=clinic_queue
```

Initialize the MySQL database and default doctors:
```bash
cd backend
./venv/bin/python init_db.py
```

### 3. Running the Application

#### Start the FastAPI Backend:
```bash
cd backend
./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at:
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc UI**: `http://127.0.0.1:8000/redoc`

#### Start the React Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, MySQL status, live entity counts |
| `GET` | `/api/stats` | Dashboard aggregated operational KPIs |
| `GET` | `/api/queue/live` | Public waiting room display feed |
| `POST` | `/api/queue/walkin` | Issue new token for walk-in patient |
| `POST` | `/api/queue/call-next` | Doctor calls the next patient in queue |
| `POST` | `/api/queue/complete/{id}`| Doctor completes patient visit with prescription |
| `GET` | `/api/patients` | Paginated search & list patient directory |
| `POST` | `/api/patients` | Register new patient |
| `GET` | `/api/doctors` | List all doctors and room assignments |
| `POST` | `/api/seed` | Seed realistic demo queue data |

---

## 📄 License
MIT License
