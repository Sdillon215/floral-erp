"""Utility to seed sample data for local development."""
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.db.session import engine
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.supplier import Supplier


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


if __name__ == "__main__":
    seed_sample_purchase_order()
