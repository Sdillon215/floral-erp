from sqlmodel import SQLModel, create_engine, Session
import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Load .env robustly: prefer repo root, but fall back to auto-discovery
explicit_root_env = Path(__file__).resolve().parents[3] / ".env"
found_env = None
if explicit_root_env.exists():
    found_env = str(explicit_root_env)
else:
    found_env = find_dotenv(filename=".env", usecwd=True) or find_dotenv()

if found_env:
    load_dotenv(found_env)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL is not set in the environment")
engine = create_engine(db_url, echo=True)

def get_session():
    with Session(engine) as session:
        yield session