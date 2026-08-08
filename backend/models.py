import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    specialization = Column(String(100), nullable=False, default="General Medicine")
    room_number = Column(String(50), nullable=False)
    status = Column(String(30), default="available", nullable=False)  # available, busy, off_duty
    phone = Column(String(30), nullable=True)
    email = Column(String(120), nullable=True)
    max_daily_tokens = Column(Integer, default=40, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    queue_tickets = relationship("QueueTicket", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)  # e.g., PAT-1001
    full_name = Column(String(150), index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    phone = Column(String(30), index=True, nullable=False)
    email = Column(String(120), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)  # A+, O+, etc.
    emergency_contact = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    queue_tickets = relationship("QueueTicket", back_populates="patient")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(30), nullable=False)  # e.g., "10:00 AM"
    status = Column(String(30), default="scheduled", nullable=False)  # scheduled, confirmed, in_progress, completed, cancelled, no_show
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    queue_ticket = relationship("QueueTicket", back_populates="appointment", uselist=False)


class QueueTicket(Base):
    __tablename__ = "queue_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token_number = Column(String(30), index=True, nullable=False)  # e.g., "A-001", "D1-002"
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), default="waiting", index=True, nullable=False)  # waiting, serving, completed, skipped, cancelled
    priority = Column(String(30), default="normal", index=True, nullable=False)  # normal, urgent, emergency, senior
    queue_date = Column(Date, default=datetime.date.today, index=True, nullable=False)
    daily_sequence = Column(Integer, default=1, nullable=False)
    estimated_wait_minutes = Column(Integer, default=15, nullable=False)
    notes = Column(Text, nullable=True)
    prescription_summary = Column(Text, nullable=True)
    issue_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    called_time = Column(DateTime, nullable=True)
    completed_time = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="queue_tickets")
    doctor = relationship("Doctor", back_populates="queue_tickets")
    appointment = relationship("Appointment", back_populates="queue_ticket")
