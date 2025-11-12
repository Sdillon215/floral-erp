from fastapi import FastAPI

from app.api.v1 import auth, users, customers, products, suppliers
from app.db.base import init_db
from app.db.session import engine

app = FastAPI(title="Mock Floral ERP Backend")

# Create tables
init_db(engine)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(suppliers.router, prefix="/api/v1/suppliers", tags=["Suppliers"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])


@app.get("/")
def root():
    return {"message": "Welcome to Mock Floral ERP Backend!"}