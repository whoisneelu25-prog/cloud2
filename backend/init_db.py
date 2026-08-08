import datetime
from database import engine, SessionLocal, Base
import models

def init_db(seed_doctors: bool = True):
    print("Creating tables in MySQL database 'clinic_queue'...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    if seed_doctors:
        db = SessionLocal()
        try:
            doc_count = db.query(models.Doctor).count()
            if doc_count == 0:
                print("Seeding initial clinic doctors...")
                initial_doctors = [
                    models.Doctor(
                        name="Dr. Rajesh Sharma",
                        specialization="General Medicine",
                        room_number="Room 101",
                        status="available",
                        phone="+91 98450 12345",
                        email="dr.sharma@careflow.in",
                        max_daily_tokens=40
                    ),
                    models.Doctor(
                        name="Dr. Ananya Iyer",
                        specialization="Cardiology",
                        room_number="Room 102",
                        status="available",
                        phone="+91 98200 45678",
                        email="dr.iyer@careflow.in",
                        max_daily_tokens=30
                    ),
                    models.Doctor(
                        name="Dr. Priya Patel",
                        specialization="Pediatrics",
                        room_number="Room 103",
                        status="available",
                        phone="+91 97112 34567",
                        email="dr.patel@careflow.in",
                        max_daily_tokens=45
                    ),
                    models.Doctor(
                        name="Dr. Vikram Malhotra",
                        specialization="Orthopedics",
                        room_number="Room 104",
                        status="available",
                        phone="+91 99887 76655",
                        email="dr.malhotra@careflow.in",
                        max_daily_tokens=25
                    ),
                    models.Doctor(
                        name="Dr. Neha Sen",
                        specialization="Dermatology",
                        room_number="Room 105",
                        status="available",
                        phone="+91 98123 45678",
                        email="dr.sen@careflow.in",
                        max_daily_tokens=35
                    ),
                ]
                db.add_all(initial_doctors)
                db.commit()
                print(f"Added {len(initial_doctors)} initial doctors.")
            else:
                print(f"Found {doc_count} existing doctors in database.")
        finally:
            db.close()

if __name__ == "__main__":
    init_db()
