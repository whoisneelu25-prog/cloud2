from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date

# ==================== DOCTOR SCHEMAS ====================
class DoctorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    specialization: str = Field(..., min_length=2, max_length=100)
    room_number: str = Field(..., min_length=1, max_length=50)
    status: str = Field("available", pattern="^(available|busy|off_duty)$")
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=120)
    max_daily_tokens: int = Field(40, ge=1, le=200)

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    specialization: Optional[str] = Field(None, min_length=2, max_length=100)
    room_number: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = Field(None, pattern="^(available|busy|off_duty)$")
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=120)
    max_daily_tokens: Optional[int] = Field(None, ge=1, le=200)

class DoctorResponse(DoctorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ==================== PATIENT SCHEMAS ====================
class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    age: int = Field(..., ge=0, le=130)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    phone: str = Field(..., min_length=5, max_length=30)
    email: Optional[str] = Field(None, max_length=120)
    address: Optional[str] = None
    blood_group: Optional[str] = Field(None, max_length=10)
    emergency_contact: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    mrn: Optional[str] = None  # Auto-generated if not supplied

class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    phone: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[str] = Field(None, max_length=120)
    address: Optional[str] = None
    blood_group: Optional[str] = Field(None, max_length=10)
    emergency_contact: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mrn: str
    created_at: datetime
    updated_at: datetime


# ==================== APPOINTMENT SCHEMAS ====================
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    time_slot: str = Field(..., min_length=2, max_length=30)
    status: str = Field("scheduled", pattern="^(scheduled|confirmed|in_progress|completed|cancelled|no_show)$")
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    appointment_date: Optional[date] = None
    time_slot: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|confirmed|in_progress|completed|cancelled|no_show)$")
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    appointment_number: str
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None


# ==================== QUEUE SCHEMAS ====================
class QueueTicketCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_id: Optional[int] = None
    priority: str = Field("normal", pattern="^(normal|urgent|emergency|senior)$")
    notes: Optional[str] = None

class QueueWalkInCreate(BaseModel):
    # Direct walk-in: registers patient if needed or selects existing, and issues ticket in one step
    patient_id: Optional[int] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    doctor_id: Optional[int] = None
    priority: str = Field("normal", pattern="^(normal|urgent|emergency|senior)$")
    notes: Optional[str] = None

class QueueTicketUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(waiting|serving|completed|skipped|cancelled)$")
    prescription_summary: Optional[str] = None
    notes: Optional[str] = None
    doctor_id: Optional[int] = None

class QueueTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    token_number: str
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_id: Optional[int] = None
    status: str
    priority: str
    queue_date: date
    daily_sequence: int
    estimated_wait_minutes: int
    notes: Optional[str] = None
    prescription_summary: Optional[str] = None
    issue_time: datetime
    called_time: Optional[datetime] = None
    completed_time: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None


# ==================== DASHBOARD & DISPLAY SCHEMAS ====================
class DoctorQueueSummary(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    room_number: str
    status: str
    current_token: Optional[str] = None
    waiting_count: int = 0
    completed_today: int = 0

class DashboardStats(BaseModel):
    total_patients: int
    today_registrations: int
    queue_waiting: int
    queue_serving: int
    queue_completed: int
    queue_skipped: int
    active_doctors: int
    avg_wait_minutes: int
    doctor_summaries: List[DoctorQueueSummary]

class LiveDisplayBoard(BaseModel):
    now_serving: List[QueueTicketResponse]
    upcoming_queue: List[QueueTicketResponse]
    doctors: List[DoctorQueueSummary]
    last_updated: datetime
