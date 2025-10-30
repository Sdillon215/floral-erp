from fastapi import FastAPI
from app.api.v1 import users
from app.db.base import init_db
from app.db.session import engine

app = FastAPI(title="Mock Floral ERP Backend")

# Create tables
init_db(engine)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/")
def root():
    return {"message": "Welcome to Mock Floral ERP Backend!"}