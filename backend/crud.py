import datetime
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc

import models
import schemas

# ==================== PATIENT CRUD ====================

def generate_mrn(db: Session) -> str:
    """Generate next unique Medical Record Number (e.g., PAT-1001)."""
    last_patient = db.query(models.Patient).order_by(models.Patient.id.desc()).first()
    next_num = 1001 if not last_patient else last_patient.id + 1001
    return f"PAT-{next_num:04d}"

def get_patient(db: Session, patient_id: int) -> Optional[models.Patient]:
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def get_patient_by_mrn(db: Session, mrn: str) -> Optional[models.Patient]:
    return db.query(models.Patient).filter(models.Patient.mrn == mrn).first()

def get_patients(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[models.Patient]:
    query = db.query(models.Patient)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                models.Patient.full_name.ilike(s),
                models.Patient.mrn.ilike(s),
                models.Patient.phone.ilike(s),
                models.Patient.email.ilike(s)
            )
        )
    return query.order_by(models.Patient.id.desc()).offset(skip).limit(limit).all()

def get_patient_count(db: Session, search: Optional[str] = None) -> int:
    query = db.query(func.count(models.Patient.id))
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                models.Patient.full_name.ilike(s),
                models.Patient.mrn.ilike(s),
                models.Patient.phone.ilike(s),
                models.Patient.email.ilike(s)
            )
        )
    return query.scalar() or 0

def create_patient(db: Session, patient_in: schemas.PatientCreate) -> models.Patient:
    mrn = patient_in.mrn or generate_mrn(db)
    # Ensure uniqueness
    while db.query(models.Patient).filter(models.Patient.mrn == mrn).first():
        next_id = (db.query(func.max(models.Patient.id)).scalar() or 0) + 1
        mrn = f"PAT-{next_id + 1000:04d}"

    db_patient = models.Patient(
        mrn=mrn,
        full_name=patient_in.full_name.strip(),
        age=patient_in.age,
        gender=patient_in.gender,
        phone=patient_in.phone.strip(),
        email=patient_in.email.strip() if patient_in.email else None,
        address=patient_in.address.strip() if patient_in.address else None,
        blood_group=patient_in.blood_group,
        emergency_contact=patient_in.emergency_contact.strip() if patient_in.emergency_contact else None,
        notes=patient_in.notes
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, update_data: schemas.PatientUpdate) -> Optional[models.Patient]:
    patient = get_patient(db, patient_id)
    if not patient:
        return None
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(patient, field, value)
    patient.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient

def delete_patient(db: Session, patient_id: int) -> bool:
    patient = get_patient(db, patient_id)
    if not patient:
        return False
    db.delete(patient)
    db.commit()
    return True


# ==================== DOCTOR CRUD ====================

def get_doctor(db: Session, doctor_id: int) -> Optional[models.Doctor]:
    return db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()

def get_doctors(
    db: Session,
    status: Optional[str] = None,
    specialization: Optional[str] = None
) -> List[models.Doctor]:
    query = db.query(models.Doctor)
    if status:
        query = query.filter(models.Doctor.status == status)
    if specialization:
        query = query.filter(models.Doctor.specialization.ilike(f"%{specialization}%"))
    return query.order_by(models.Doctor.name.asc()).all()

def create_doctor(db: Session, doc_in: schemas.DoctorCreate) -> models.Doctor:
    db_doctor = models.Doctor(
        name=doc_in.name.strip(),
        specialization=doc_in.specialization.strip(),
        room_number=doc_in.room_number.strip(),
        status=doc_in.status,
        phone=doc_in.phone.strip() if doc_in.phone else None,
        email=doc_in.email.strip() if doc_in.email else None,
        max_daily_tokens=doc_in.max_daily_tokens
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def update_doctor(db: Session, doctor_id: int, update_data: schemas.DoctorUpdate) -> Optional[models.Doctor]:
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        return None
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(doctor, field, value)
    doctor.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(doctor)
    return doctor

def delete_doctor(db: Session, doctor_id: int) -> bool:
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        return False
    db.delete(doctor)
    db.commit()
    return True


# ==================== APPOINTMENT CRUD ====================

def generate_appointment_number(db: Session, appt_date: datetime.date) -> str:
    date_str = appt_date.strftime("%Y%m%d")
    count_today = db.query(func.count(models.Appointment.id)).filter(
        models.Appointment.appointment_date == appt_date
    ).scalar() or 0
    return f"APT-{date_str}-{count_today + 1:03d}"

def get_appointment(db: Session, appointment_id: int) -> Optional[models.Appointment]:
    return db.query(models.Appointment).options(
        joinedload(models.Appointment.patient),
        joinedload(models.Appointment.doctor)
    ).filter(models.Appointment.id == appointment_id).first()

def get_appointments(
    db: Session,
    appointment_date: Optional[datetime.date] = None,
    doctor_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    status: Optional[str] = None
) -> List[models.Appointment]:
    query = db.query(models.Appointment).options(
        joinedload(models.Appointment.patient),
        joinedload(models.Appointment.doctor)
    )
    if appointment_date:
        query = query.filter(models.Appointment.appointment_date == appointment_date)
    if doctor_id:
        query = query.filter(models.Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(models.Appointment.patient_id == patient_id)
    if status:
        query = query.filter(models.Appointment.status == status)
    return query.order_by(models.Appointment.appointment_date.desc(), models.Appointment.time_slot.asc()).all()

def create_appointment(db: Session, appt_in: schemas.AppointmentCreate) -> models.Appointment:
    appt_number = generate_appointment_number(db, appt_in.appointment_date)
    db_appt = models.Appointment(
        appointment_number=appt_number,
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        appointment_date=appt_in.appointment_date,
        time_slot=appt_in.time_slot.strip(),
        status=appt_in.status,
        notes=appt_in.notes
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return get_appointment(db, db_appt.id)

def update_appointment(db: Session, appointment_id: int, update_data: schemas.AppointmentUpdate) -> Optional[models.Appointment]:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        return None
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None and isinstance(value, str):
            value = value.strip()
        setattr(appt, field, value)
    appt.updated_at = datetime.datetime.utcnow()
    db.commit()
    return get_appointment(db, appointment_id)

def delete_appointment(db: Session, appointment_id: int) -> bool:
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        return False
    db.delete(appt)
    db.commit()
    return True


# ==================== QUEUE ENGINE & OPERATIONS ====================

def get_specialty_prefix(specialization: Optional[str], doctor_id: Optional[int]) -> str:
    """Return a short prefix for token numbering (e.g. A, B, C or GEN, PED)."""
    if not specialization:
        return "A"
    spec_clean = specialization.upper()
    if "GENERAL" in spec_clean:
        return "A"
    if "CARDIO" in spec_clean:
        return "C"
    if "PEDIA" in spec_clean:
        return "P"
    if "ORTHO" in spec_clean:
        return "O"
    if "DERMA" in spec_clean:
        return "D"
    if "ENT" in spec_clean:
        return "E"
    if "OPHTH" in spec_clean:
        return "V"
    if doctor_id:
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
        return chars[(doctor_id - 1) % len(chars)]
    return "A"

def generate_token_number(db: Session, doctor_id: Optional[int], today: datetime.date, priority: str = "normal") -> tuple[str, int]:
    """Generate daily sequence and token string like A-001 or EMG-001."""
    # Count tickets for today
    today_count = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today
    ).scalar() or 0
    seq = today_count + 1

    prefix = "A"
    if priority == "emergency":
        prefix = "EMG"
    elif doctor_id:
        doc = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
        if doc:
            prefix = get_specialty_prefix(doc.specialization, doc.id)

    token = f"{prefix}-{seq:03d}"
    return token, seq

def issue_queue_ticket(
    db: Session,
    patient_id: int,
    doctor_id: Optional[int] = None,
    appointment_id: Optional[int] = None,
    priority: str = "normal",
    notes: Optional[str] = None
) -> models.QueueTicket:
    today = datetime.date.today()
    token, seq = generate_token_number(db, doctor_id, today, priority)

    # Calculate estimated wait time based on waiting queue count
    waiting_count = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "waiting",
        models.QueueTicket.doctor_id == doctor_id if doctor_id else True
    ).scalar() or 0
    estimated_wait = max(5, waiting_count * 12)

    db_ticket = models.QueueTicket(
        token_number=token,
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        status="waiting",
        priority=priority,
        queue_date=today,
        daily_sequence=seq,
        estimated_wait_minutes=estimated_wait,
        notes=notes,
        issue_time=datetime.datetime.utcnow()
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return get_queue_ticket(db, db_ticket.id)

def get_queue_ticket(db: Session, ticket_id: int) -> Optional[models.QueueTicket]:
    return db.query(models.QueueTicket).options(
        joinedload(models.QueueTicket.patient),
        joinedload(models.QueueTicket.doctor),
        joinedload(models.QueueTicket.appointment)
    ).filter(models.QueueTicket.id == ticket_id).first()

def get_live_queue(
    db: Session,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    queue_date: Optional[datetime.date] = None
) -> List[models.QueueTicket]:
    today = queue_date or datetime.date.today()
    query = db.query(models.QueueTicket).options(
        joinedload(models.QueueTicket.patient),
        joinedload(models.QueueTicket.doctor)
    ).filter(models.QueueTicket.queue_date == today)

    if doctor_id:
        query = query.filter(models.QueueTicket.doctor_id == doctor_id)
    if status:
        query = query.filter(models.QueueTicket.status == status)

    # Custom priority order: emergency first, then urgent, senior, normal
    priority_order = func.field(models.QueueTicket.priority, "emergency", "urgent", "senior", "normal")
    return query.order_by(
        priority_order.asc(),
        models.QueueTicket.daily_sequence.asc()
    ).all()

def call_next_patient(db: Session, doctor_id: int) -> Optional[models.QueueTicket]:
    """
    Finds next waiting ticket for the given doctor (or unassigned queue),
    marks it 'serving', sets called_time, and marks any previous serving ticket of that doctor as 'completed'.
    """
    today = datetime.date.today()

    # Automatically complete currently serving ticket for this doctor if any
    current_serving = db.query(models.QueueTicket).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.doctor_id == doctor_id,
        models.QueueTicket.status == "serving"
    ).all()
    for s_ticket in current_serving:
        s_ticket.status = "completed"
        s_ticket.completed_time = datetime.datetime.utcnow()

    # Priority sorting: emergency -> urgent -> senior -> normal
    priority_order = func.field(models.QueueTicket.priority, "emergency", "urgent", "senior", "normal")
    next_ticket = db.query(models.QueueTicket).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "waiting",
        or_(
            models.QueueTicket.doctor_id == doctor_id,
            models.QueueTicket.doctor_id.is_(None)
        )
    ).order_by(
        priority_order.asc(),
        models.QueueTicket.daily_sequence.asc()
    ).first()

    if not next_ticket:
        db.commit()
        return None

    next_ticket.doctor_id = doctor_id
    next_ticket.status = "serving"
    next_ticket.called_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(next_ticket)
    return get_queue_ticket(db, next_ticket.id)

def update_queue_ticket_status(
    db: Session,
    ticket_id: int,
    status: str,
    prescription_summary: Optional[str] = None,
    notes: Optional[str] = None,
    doctor_id: Optional[int] = None
) -> Optional[models.QueueTicket]:
    ticket = db.query(models.QueueTicket).filter(models.QueueTicket.id == ticket_id).first()
    if not ticket:
        return None

    ticket.status = status
    if doctor_id is not None:
        ticket.doctor_id = doctor_id
    if prescription_summary is not None:
        ticket.prescription_summary = prescription_summary
    if notes is not None:
        ticket.notes = notes

    now = datetime.datetime.utcnow()
    if status == "serving" and not ticket.called_time:
        ticket.called_time = now
    elif status == "completed":
        ticket.completed_time = now

    db.commit()
    db.refresh(ticket)
    return get_queue_ticket(db, ticket.id)

def delete_queue_ticket(db: Session, ticket_id: int) -> bool:
    ticket = db.query(models.QueueTicket).filter(models.QueueTicket.id == ticket_id).first()
    if not ticket:
        return False
    db.delete(ticket)
    db.commit()
    return True


# ==================== DASHBOARD & REALTIME STATS ====================

def get_dashboard_stats(db: Session) -> schemas.DashboardStats:
    today = datetime.date.today()

    total_patients = db.query(func.count(models.Patient.id)).scalar() or 0
    today_registrations = db.query(func.count(models.Patient.id)).filter(
        func.date(models.Patient.created_at) == today
    ).scalar() or 0

    # Queue counts today
    q_waiting = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "waiting"
    ).scalar() or 0

    q_serving = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "serving"
    ).scalar() or 0

    q_completed = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "completed"
    ).scalar() or 0

    q_skipped = db.query(func.count(models.QueueTicket.id)).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "skipped"
    ).scalar() or 0

    # Active doctors
    doctors = db.query(models.Doctor).all()
    active_docs_count = sum(1 for d in doctors if d.status == "available")

    # Doctor summaries
    doc_summaries = []
    for doc in doctors:
        # Current serving token
        serving_ticket = db.query(models.QueueTicket).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "serving"
        ).first()

        waiting_count = db.query(func.count(models.QueueTicket.id)).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "waiting"
        ).scalar() or 0

        completed_count = db.query(func.count(models.QueueTicket.id)).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "completed"
        ).scalar() or 0

        doc_summaries.append(
            schemas.DoctorQueueSummary(
                doctor_id=doc.id,
                doctor_name=doc.name,
                specialization=doc.specialization,
                room_number=doc.room_number,
                status=doc.status,
                current_token=serving_ticket.token_number if serving_ticket else None,
                waiting_count=waiting_count,
                completed_today=completed_count
            )
        )

    # Average wait time estimation
    avg_wait = 12 if q_waiting == 0 else max(5, int((q_waiting / max(1, active_docs_count)) * 10))

    return schemas.DashboardStats(
        total_patients=total_patients,
        today_registrations=today_registrations,
        queue_waiting=q_waiting,
        queue_serving=q_serving,
        queue_completed=q_completed,
        queue_skipped=q_skipped,
        active_doctors=active_docs_count,
        avg_wait_minutes=avg_wait,
        doctor_summaries=doc_summaries
    )

def get_live_display_board(db: Session) -> schemas.LiveDisplayBoard:
    today = datetime.date.today()

    now_serving = db.query(models.QueueTicket).options(
        joinedload(models.QueueTicket.patient),
        joinedload(models.QueueTicket.doctor)
    ).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "serving"
    ).order_by(models.QueueTicket.called_time.desc()).all()

    priority_order = func.field(models.QueueTicket.priority, "emergency", "urgent", "senior", "normal")
    upcoming = db.query(models.QueueTicket).options(
        joinedload(models.QueueTicket.patient),
        joinedload(models.QueueTicket.doctor)
    ).filter(
        models.QueueTicket.queue_date == today,
        models.QueueTicket.status == "waiting"
    ).order_by(
        priority_order.asc(),
        models.QueueTicket.daily_sequence.asc()
    ).limit(10).all()

    doctors = db.query(models.Doctor).all()
    doc_summaries = []
    for doc in doctors:
        serving_ticket = db.query(models.QueueTicket).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "serving"
        ).first()

        waiting_count = db.query(func.count(models.QueueTicket.id)).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "waiting"
        ).scalar() or 0

        completed_count = db.query(func.count(models.QueueTicket.id)).filter(
            models.QueueTicket.queue_date == today,
            models.QueueTicket.doctor_id == doc.id,
            models.QueueTicket.status == "completed"
        ).scalar() or 0

        doc_summaries.append(
            schemas.DoctorQueueSummary(
                doctor_id=doc.id,
                doctor_name=doc.name,
                specialization=doc.specialization,
                room_number=doc.room_number,
                status=doc.status,
                current_token=serving_ticket.token_number if serving_ticket else None,
                waiting_count=waiting_count,
                completed_today=completed_count
            )
        )

    return schemas.LiveDisplayBoard(
        now_serving=now_serving,
        upcoming_queue=upcoming,
        doctors=doc_summaries,
        last_updated=datetime.datetime.utcnow()
    )
