"""Utility to seed sample data for local development."""
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.security import hash_password
from app.db.session import engine
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.supplier import Supplier
from app.models.user import User


def seed_sample_purchase_order() -> None:
    with Session(engine) as session:
        supplier = session.exec(
            select(Supplier).where(Supplier.email == "seed@supplier.local")
        ).first()
        if not supplier:
            supplier = Supplier(name="Seed Supplier", email="seed@supplier.local")
            session.add(supplier)
            session.commit()
            session.refresh(supplier)

        product = session.exec(
            select(Product).where(Product.sku == "SEED-ROSE-001")
        ).first()
        if not product:
            product = Product(sku="SEED-ROSE-001", name="Seed Red Rose", unit_price=2.5)
            session.add(product)
            session.commit()
            session.refresh(product)

        existing_po = session.exec(
            select(PurchaseOrder).where(PurchaseOrder.supplier_id == supplier.id)
        ).first()
        if existing_po:
            return

        purchase_order = PurchaseOrder(
            supplier_id=supplier.id,
            status="received",
            order_date=datetime.now(timezone.utc),
            received_date=datetime.now(timezone.utc),
            lines=[
                PurchaseOrderLine(product_id=product.id, quantity=100, unit_cost=2.0),
            ],
        )
        session.add(purchase_order)
        session.commit()


def seed_admin_user(email: str = "admin@example.com", password: str = "adminpass") -> User:
    """Seed an initial admin user for system setup.
    
    Args:
        email: Admin user email (default: admin@example.com)
        password: Admin user password (default: adminpass)
    
    Returns:
        The created or existing admin User
    """
    with Session(engine) as session:
        # Check if admin user already exists
        existing_admin = session.exec(
            select(User).where(User.email == email)
        ).first()
        
        if existing_admin:
            print(f"Admin user with email '{email}' already exists.")
            return existing_admin
        
        # Create new admin user
        admin_user = User(
            email=email,
            hashed_password=hash_password(password),
            is_admin=True,
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print(f"Admin user created successfully: {email}")
        return admin_user


if __name__ == "__main__":
    import sys
    
    # Seed admin user
    if len(sys.argv) > 1 and sys.argv[1] == "admin":
        email = sys.argv[2] if len(sys.argv) > 2 else "admin@example.com"
        password = sys.argv[3] if len(sys.argv) > 3 else "adminpass"
        seed_admin_user(email, password)
    else:
        # Default: seed sample purchase order
        seed_sample_purchase_order()
