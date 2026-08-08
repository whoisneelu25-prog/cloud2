import time
from database import SessionLocal
import models
import crud
import schemas

def run_tests():
    print("=== TESTING DATABASE CRUD DIRECTLY ===")
    db = SessionLocal()
    try:
        # Test Doctor fetch
        doctors = crud.get_doctors(db)
        print(f"[OK] Fetched {len(doctors)} doctors from MySQL.")
        assert len(doctors) >= 5, "Expected at least 5 doctors"

        # Test Patient Registration
        test_patient = schemas.PatientCreate(
            full_name="Test Patient LocalDB",
            age=34,
            gender="Female",
            phone="+91 98450 99001",
            email="testpatient@local.db",
            blood_group="O+",
            emergency_contact="Emergency Contact",
            notes="Testing local MySQL persistence"
        )
        patient_obj = crud.create_patient(db, test_patient)
        print(f"[OK] Created Patient in MySQL with MRN: {patient_obj.mrn}, ID: {patient_obj.id}")
        assert patient_obj.id is not None
        assert patient_obj.mrn.startswith("PAT-")

        # Test Queue Ticket Issuance
        doc_id = doctors[0].id
        ticket = crud.issue_queue_ticket(
            db=db,
            patient_id=patient_obj.id,
            doctor_id=doc_id,
            priority="normal",
            notes="Direct test ticket"
        )
        print(f"[OK] Issued Ticket in MySQL: {ticket.token_number}, Status: {ticket.status}")
        assert ticket.status == "waiting"

        # Test Call Next Patient
        called_ticket = crud.call_next_patient(db, doc_id)
        print(f"[OK] Doctor called next patient: Ticket ID {called_ticket.id if called_ticket else None}, Token: {called_ticket.token_number if called_ticket else None}, Status: {called_ticket.status if called_ticket else None}")

        # Test Complete Ticket
        if called_ticket:
            completed_ticket = crud.update_queue_ticket_status(
                db, called_ticket.id, "completed", prescription_summary="Paracetamol 500mg TDS, Rest 2 days"
            )
            print(f"[OK] Completed Ticket in MySQL: {completed_ticket.token_number}, Status: {completed_ticket.status}, Prescription: {completed_ticket.prescription_summary}")

        # Test Dashboard stats
        stats = crud.get_dashboard_stats(db)
        print(f"[OK] Dashboard Stats: Total Patients={stats.total_patients}, Waiting={stats.queue_waiting}, Completed={stats.queue_completed}")

        print("=== ALL DATABASE & CRUD TESTS PASSED ===")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
