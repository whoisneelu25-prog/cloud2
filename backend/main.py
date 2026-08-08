import os
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db, engine, Base
import models
import schemas
import crud

app = FastAPI(
    title="Clinic Queue Management API",
    description="Full-stack clinic queue management system backend with MySQL persistence",
    version="1.0.0"
)

# Enable CORS for Frontend development server (Vite default is 5173, also allow any local port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== SYSTEM & HEALTH ENDPOINTS ====================

@app.get("/api/health", summary="Health Check and MySQL Connectivity")
def health_check(db: Session = Depends(get_db)):
    try:
        # Run a lightweight test query
        db.execute(text("SELECT 1"))
        doc_count = db.query(models.Doctor).count()
        patient_count = db.query(models.Patient).count()
        queue_count = db.query(models.QueueTicket).count()

        return {
            "status": "online",
            "database": "connected",
            "database_name": "clinic_queue",
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", "3306")),
            "counts": {
                "doctors": doc_count,
                "patients": patient_count,
                "queue_tickets": queue_count
            },
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )


@app.get("/api/stats", response_model=schemas.DashboardStats, summary="Dashboard KPI Metrics")
def get_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@app.get("/api/queue/display", response_model=schemas.LiveDisplayBoard, summary="Live Display TV Board")
def get_display_board(db: Session = Depends(get_db)):
    return crud.get_live_display_board(db)


# ==================== DOCTOR ENDPOINTS ====================

@app.get("/api/doctors", response_model=List[schemas.DoctorResponse], summary="List all Doctors")
def list_doctors(
    status_filter: Optional[str] = Query(None, alias="status"),
    specialization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_doctors(db, status=status_filter, specialization=specialization)


@app.get("/api/doctors/{doctor_id}", response_model=schemas.DoctorResponse, summary="Get Doctor by ID")
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@app.post("/api/doctors", response_model=schemas.DoctorResponse, status_code=status.HTTP_201_CREATED, summary="Create New Doctor")
def create_doctor(doc_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
    return crud.create_doctor(db, doc_in)


@app.put("/api/doctors/{doctor_id}", response_model=schemas.DoctorResponse, summary="Update Doctor Info or Status")
def update_doctor(doctor_id: int, doc_in: schemas.DoctorUpdate, db: Session = Depends(get_db)):
    updated = crud.update_doctor(db, doctor_id, doc_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return updated


@app.delete("/api/doctors/{doctor_id}", summary="Delete Doctor")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    success = crud.delete_doctor(db, doctor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor deleted successfully", "id": doctor_id}


# ==================== PATIENT ENDPOINTS ====================

@app.get("/api/patients", summary="List and Search Patients")
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    patients = crud.get_patients(db, skip=skip, limit=limit, search=search)
    total = crud.get_patient_count(db, search=search)
    return {
        "items": [schemas.PatientResponse.model_validate(p) for p in patients],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@app.get("/api/patients/{patient_id}", summary="Get Patient Details & History")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Fetch patient's past appointments and queue tickets
    appointments = db.query(models.Appointment).filter(models.Appointment.patient_id == patient_id).order_by(models.Appointment.created_at.desc()).all()
    queue_tickets = db.query(models.QueueTicket).filter(models.QueueTicket.patient_id == patient_id).order_by(models.QueueTicket.created_at.desc() if hasattr(models.QueueTicket, 'created_at') else models.QueueTicket.id.desc()).all()

    return {
        "patient": schemas.PatientResponse.model_validate(patient),
        "appointments": [schemas.AppointmentResponse.model_validate(a) for a in appointments],
        "tickets": [schemas.QueueTicketResponse.model_validate(t) for t in queue_tickets]
    }


@app.post("/api/patients", response_model=schemas.PatientResponse, status_code=status.HTTP_201_CREATED, summary="Register New Patient")
def create_patient(patient_in: schemas.PatientCreate, db: Session = Depends(get_db)):
    return crud.create_patient(db, patient_in)


@app.put("/api/patients/{patient_id}", response_model=schemas.PatientResponse, summary="Update Patient Info")
def update_patient(patient_id: int, patient_in: schemas.PatientUpdate, db: Session = Depends(get_db)):
    updated = crud.update_patient(db, patient_id, patient_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated


@app.delete("/api/patients/{patient_id}", summary="Delete Patient")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    success = crud.delete_patient(db, patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully", "id": patient_id}


# ==================== QUEUE ENDPOINTS ====================

@app.get("/api/queue", response_model=List[schemas.QueueTicketResponse], summary="List Queue Tickets")
def list_queue(
    doctor_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    date_str: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db)
):
    target_date = None
    if date_str:
        try:
            target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    return crud.get_live_queue(db, doctor_id=doctor_id, status=status_filter, queue_date=target_date)


@app.post("/api/queue/ticket", response_model=schemas.QueueTicketResponse, status_code=status.HTTP_201_CREATED, summary="Issue Queue Ticket for Patient")
def issue_ticket(ticket_in: schemas.QueueTicketCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    patient = crud.get_patient(db, ticket_in.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # If doctor provided, verify doctor
    if ticket_in.doctor_id:
        doctor = crud.get_doctor(db, ticket_in.doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

    ticket = crud.issue_queue_ticket(
        db=db,
        patient_id=ticket_in.patient_id,
        doctor_id=ticket_in.doctor_id,
        appointment_id=ticket_in.appointment_id,
        priority=ticket_in.priority,
        notes=ticket_in.notes
    )
    return ticket


@app.post("/api/queue/walkin", response_model=schemas.QueueTicketResponse, status_code=status.HTTP_201_CREATED, summary="Quick Walk-in Registration & Ticket Issuance")
def walkin_registration(walkin: schemas.QueueWalkInCreate, db: Session = Depends(get_db)):
    # If patient_id provided, use existing
    patient_id = walkin.patient_id
    if not patient_id:
        if not walkin.full_name or walkin.age is None or not walkin.gender or not walkin.phone:
            raise HTTPException(
                status_code=400,
                detail="Full name, age, gender, and phone are required for new patient registration"
            )
        new_patient = schemas.PatientCreate(
            full_name=walkin.full_name,
            age=walkin.age,
            gender=walkin.gender,
            phone=walkin.phone,
            email=walkin.email,
            blood_group=walkin.blood_group,
            emergency_contact=walkin.emergency_contact
        )
        saved_patient = crud.create_patient(db, new_patient)
        patient_id = saved_patient.id

    ticket = crud.issue_queue_ticket(
        db=db,
        patient_id=patient_id,
        doctor_id=walkin.doctor_id,
        priority=walkin.priority,
        notes=walkin.notes
    )
    return ticket


@app.post("/api/queue/call-next/{doctor_id}", response_model=Optional[schemas.QueueTicketResponse], summary="Doctor Call Next Patient")
def doctor_call_next(doctor_id: int, db: Session = Depends(get_db)):
    doctor = crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    called_ticket = crud.call_next_patient(db, doctor_id)
    return called_ticket


@app.put("/api/queue/{ticket_id}/status", response_model=schemas.QueueTicketResponse, summary="Update Ticket Status (Serving, Completed, Skipped, Cancelled)")
def update_ticket_status(ticket_id: int, update_in: schemas.QueueTicketUpdateStatus, db: Session = Depends(get_db)):
    updated = crud.update_queue_ticket_status(
        db=db,
        ticket_id=ticket_id,
        status=update_in.status,
        prescription_summary=update_in.prescription_summary,
        notes=update_in.notes,
        doctor_id=update_in.doctor_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Queue ticket not found")
    return updated


@app.delete("/api/queue/{ticket_id}", summary="Delete Queue Ticket")
def delete_queue_ticket(ticket_id: int, db: Session = Depends(get_db)):
    success = crud.delete_queue_ticket(db, ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail="Queue ticket not found")
    return {"message": "Queue ticket deleted successfully", "id": ticket_id}


# ==================== APPOINTMENT ENDPOINTS ====================

@app.get("/api/appointments", response_model=List[schemas.AppointmentResponse], summary="List Appointments")
def list_appointments(
    date_str: Optional[str] = Query(None, alias="date"),
    doctor_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    target_date = None
    if date_str:
        try:
            target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    return crud.get_appointments(
        db,
        appointment_date=target_date,
        doctor_id=doctor_id,
        patient_id=patient_id,
        status=status_filter
    )


@app.post("/api/appointments", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED, summary="Create Appointment")
def create_appointment(appt_in: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # Verify patient and doctor exist
    if not crud.get_patient(db, appt_in.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if not crud.get_doctor(db, appt_in.doctor_id):
        raise HTTPException(status_code=404, detail="Doctor not found")
    return crud.create_appointment(db, appt_in)


@app.put("/api/appointments/{appointment_id}", response_model=schemas.AppointmentResponse, summary="Update Appointment")
def update_appointment(appointment_id: int, appt_in: schemas.AppointmentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_appointment(db, appointment_id, appt_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated


@app.delete("/api/appointments/{appointment_id}", summary="Delete Appointment")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    success = crud.delete_appointment(db, appointment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully", "id": appointment_id}


# ==================== SAMPLE SEED DEMO ENDPOINT ====================

@app.post("/api/seed", summary="Seed Sample Clinic Activity Data")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed sample patients and queue activity for demonstration."""
    sample_patients = [
        {"full_name": "Aarav Sharma", "age": 32, "gender": "Male", "phone": "+91 98451 12345", "blood_group": "O+", "emergency_contact": "Sunita Sharma (Wife)", "notes": "Mild fever and sore throat"},
        {"full_name": "Rohan Gupta", "age": 54, "gender": "Male", "phone": "+91 98201 45678", "blood_group": "A+", "emergency_contact": "Meera Gupta (Wife)", "notes": "Routine cardiology follow-up, BP check"},
        {"full_name": "Diya Sundaram", "age": 6, "gender": "Female", "phone": "+91 97113 34567", "blood_group": "B+", "emergency_contact": "Kavita Sundaram (Mother)", "notes": "Seasonal allergy consultation"},
        {"full_name": "Harish Verma", "age": 61, "gender": "Male", "phone": "+91 99888 76655", "blood_group": "AB+", "emergency_contact": "Pooja Verma (Daughter)", "notes": "Knee pain evaluation, Ortho"},
        {"full_name": "Sneha Nair", "age": 28, "gender": "Female", "phone": "+91 98124 45678", "blood_group": "O-", "emergency_contact": "Aditya Nair (Husband)", "notes": "Skin rash assessment, Dermatology"}
    ]

    doctors = db.query(models.Doctor).all()
    if not doctors:
        crud.init_db()
        doctors = db.query(models.Doctor).all()

    created_patients = []
    for p_data in sample_patients:
        # Check if exists by phone
        existing = db.query(models.Patient).filter(models.Patient.phone == p_data["phone"]).first()
        if not existing:
            p_obj = crud.create_patient(db, schemas.PatientCreate(**p_data))
            created_patients.append(p_obj)
        else:
            created_patients.append(existing)

    # Issue sample queue tickets for today
    today = datetime.date.today()
    existing_tickets = db.query(models.QueueTicket).filter(models.QueueTicket.queue_date == today).count()
    if existing_tickets == 0 and created_patients and doctors:
        # Ticket 1: Dr. Jenkins (Serving)
        t1 = crud.issue_queue_ticket(db, created_patients[0].id, doctors[0].id, priority="normal", notes="Fever check")
        crud.update_queue_ticket_status(db, t1.id, "serving", doctor_id=doctors[0].id)

        # Ticket 2: Dr. Chen (Waiting, Senior)
        if len(created_patients) > 1 and len(doctors) > 1:
            crud.issue_queue_ticket(db, created_patients[1].id, doctors[1].id, priority="senior", notes="BP check")

        # Ticket 3: Dr. Patel (Waiting, Urgent)
        if len(created_patients) > 2 and len(doctors) > 2:
            crud.issue_queue_ticket(db, created_patients[2].id, doctors[2].id, priority="urgent", notes="Allergy")

        # Ticket 4: Dr. Vance (Waiting, Normal)
        if len(created_patients) > 3 and len(doctors) > 3:
            crud.issue_queue_ticket(db, created_patients[3].id, doctors[3].id, priority="normal", notes="Knee joint")

        # Ticket 5: Dr. Rostova (Waiting, Normal)
        if len(created_patients) > 4 and len(doctors) > 4:
            crud.issue_queue_ticket(db, created_patients[4].id, doctors[4].id, priority="normal", notes="Dermatology")

    return {"message": "Sample clinic data initialized successfully", "patients_ready": len(created_patients)}
