"""Clear all transactional and inventory data from the database.

This script removes:
- Purchase Orders and their lines
- Sales Orders and their lines
- Inventory Items
- Inventory Transactions

It does NOT remove:
- Products
- Suppliers
- Customers
- Users
"""
from sqlmodel import Session, select

from app.db.session import engine
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.sales_order import SalesOrder, SalesOrderLine


def clear_all_data() -> None:
    """Clear all transactional and inventory data."""
    print("Clearing all transactional and inventory data...")
    
    with Session(engine) as session:
        # Delete in order to respect foreign key constraints
        
        # 1. Delete Sales Order Lines
        so_lines = session.exec(select(SalesOrderLine)).all()
        print(f"  Deleting {len(so_lines)} sales order lines...")
        for line in so_lines:
            session.delete(line)
        session.commit()
        
        # 2. Delete Sales Orders
        sales_orders = session.exec(select(SalesOrder)).all()
        print(f"  Deleting {len(sales_orders)} sales orders...")
        for so in sales_orders:
            session.delete(so)
        session.commit()
        
        # 3. Delete Purchase Order Lines
        po_lines = session.exec(select(PurchaseOrderLine)).all()
        print(f"  Deleting {len(po_lines)} purchase order lines...")
        for line in po_lines:
            session.delete(line)
        session.commit()
        
        # 4. Delete Purchase Orders
        purchase_orders = session.exec(select(PurchaseOrder)).all()
        print(f"  Deleting {len(purchase_orders)} purchase orders...")
        for po in purchase_orders:
            session.delete(po)
        session.commit()
        
        # 5. Delete Inventory Transactions
        transactions = session.exec(select(InventoryTransaction)).all()
        print(f"  Deleting {len(transactions)} inventory transactions...")
        for trans in transactions:
            session.delete(trans)
        session.commit()
        
        # 6. Delete Inventory Items
        inventory_items = session.exec(select(InventoryItem)).all()
        print(f"  Deleting {len(inventory_items)} inventory items...")
        for item in inventory_items:
            session.delete(item)
        session.commit()
        
        print("✓ All transactional and inventory data cleared!")


def clear_products() -> None:
    """Clear all products."""
    print("Clearing all products...")
    
    with Session(engine) as session:
        from app.models.product import Product
        
        products = session.exec(select(Product)).all()
        print(f"  Deleting {len(products)} products...")
        for product in products:
            session.delete(product)
        session.commit()
        
        print("✓ All products cleared!")


if __name__ == "__main__":
    import sys
    
    should_clear_products = False
    if len(sys.argv) > 1 and sys.argv[1] == "--include-products":
        should_clear_products = True
    
    # Clear transactional data first (to avoid foreign key constraints)
    clear_all_data()
    
    # Then clear products if requested
    if should_clear_products:
        clear_products()
    
    print("\n✓ Database cleared and ready for fresh seeding!")

