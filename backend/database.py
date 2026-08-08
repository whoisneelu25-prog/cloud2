import os
import urllib.parse
from dotenv import load_dotenv
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_FILE):
    load_dotenv(dotenv_path=ENV_FILE)
else:
    load_dotenv()


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "clinic_queue")

encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

def ensure_database_exists():
    """Ensure that the MySQL clinic_queue database exists before connecting."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4"
        )
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB INIT ERROR] Could not verify/create database '{DB_NAME}': {e}")
        raise e

# Ensure database exists
ensure_database_exists()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
