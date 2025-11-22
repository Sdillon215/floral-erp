from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, customers, products, suppliers, purchase_orders, inventory, sales_orders
from app.db.base import init_db
from app.db.session import engine

app = FastAPI(title="Mock Floral ERP Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default
        "http://localhost:3001",  # Alternative Next.js port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
init_db(engine)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(suppliers.router, prefix="/api/v1/suppliers", tags=["Suppliers"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(purchase_orders.router, prefix="/api/v1/purchase-orders", tags=["Purchase Orders"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(sales_orders.router, prefix="/api/v1/sales-orders", tags=["Sales Orders"])


@app.get("/")
def root():
    return {"message": "Welcome to Mock Floral ERP Backend!"}