"""Seed historical data for the past year with balanced inventory.

This script creates:
- 52 purchase orders (one per week)
- Multiple sales orders per week that consume all PO inventory
- All inventory is balanced (all PO inventory is sold)
"""
import random
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from sqlmodel import Session, select

from app.db.session import engine
from app.models.customer import Customer
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.supplier import Supplier
from app.models.user import User


def get_or_create_entities(session: Session) -> Tuple[List[Product], List[Supplier], List[Customer], User]:
    """Get or create required entities for seeding."""
    # Get products (must exist)
    products = session.exec(select(Product).where(Product.is_active == True)).all()
    if not products:
        raise ValueError("No active products found. Please create products first.")
    
    # Get or create suppliers
    suppliers = session.exec(select(Supplier).where(Supplier.is_active == True)).all()
    if not suppliers:
        # Create a default supplier
        supplier = Supplier(
            name="Main Floral Supplier",
            email="supplier@floral.com",
            contact_name="John Supplier",
            phone="555-0100",
            is_active=True
        )
        session.add(supplier)
        session.commit()
        session.refresh(supplier)
        suppliers = [supplier]
    
    # Get or create customers
    customers = session.exec(select(Customer).where(Customer.is_active == True)).all()
    if not customers:
        # Create default customers
        customer_names = [
            ("Flower Shop Downtown", "downtown@flowershop.com"),
            ("Wedding Planners Inc", "orders@weddingplanners.com"),
            ("Event Decor Co", "sales@eventdecor.com"),
            ("Garden Center", "orders@gardencenter.com"),
            ("Corporate Events LLC", "purchasing@corpevents.com"),
        ]
        for name, email in customer_names:
            customer = Customer(
                name=name,
                email=email,
                phone=f"555-{random.randint(1000, 9999)}",
                is_active=True
            )
            session.add(customer)
        session.commit()
        customers = session.exec(select(Customer).where(Customer.is_active == True)).all()
    
    # Get or create a sales user
    user = session.exec(select(User).where(User.role == "sales").limit(1)).first()
    if not user:
        # Create a default sales user
        from app.core.security import hash_password
        user = User(
            email="sales@floral.com",
            hashed_password=hash_password("salespass"),
            role="sales",
            is_active=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    return products, suppliers, customers, user


def create_weekly_data(
    session: Session,
    week_start: datetime,
    products: List[Product],
    suppliers: List[Supplier],
    customers: List[Customer],
    user: User,
) -> None:
    """Create one week's worth of data: 1 PO and multiple SOs that consume it."""
    
    # 1. Create Purchase Order (received on week start + 2 days)
    po_date = week_start + timedelta(days=2)
    supplier = random.choice(suppliers)
    
    # Select 2-3 random products for this PO
    po_products = random.sample(products, min(random.randint(2, 3), len(products)))
    
    # Create PO lines with quantities
    po_lines = []
    for product in po_products:
        quantity = random.randint(50, 200)  # Reasonable order quantity
        unit_cost = round(product.unit_price * random.uniform(0.5, 0.8), 2)  # Cost is 50-80% of sale price
        po_lines.append({
            "product_id": product.id,
            "quantity": quantity,
            "unit_cost": unit_cost,
        })
    
    # Create PO
    purchase_order = PurchaseOrder(
        supplier_id=supplier.id,
        status="received",
        order_date=po_date,
        received_date=po_date + timedelta(hours=6),  # Received same day, 6 hours later
    )
    session.add(purchase_order)
    session.flush()
    
    # Create PO lines
    for line_data in po_lines:
        po_line = PurchaseOrderLine(
            purchase_order_id=purchase_order.id,
            **line_data
        )
        session.add(po_line)
    session.flush()
    
    # Apply receipt (update inventory)
    for line_data in po_lines:
        item = session.get(InventoryItem, line_data["product_id"])
        if not item:
            item = InventoryItem(product_id=line_data["product_id"], on_hand=0, allocated=0)
            session.add(item)
            session.flush()
        item.on_hand += line_data["quantity"]
        
        transaction = InventoryTransaction(
            product_id=line_data["product_id"],
            quantity_delta=line_data["quantity"],
            reference=f"PO:{purchase_order.id}",
            type="purchase_receipt",
            created_at=po_date + timedelta(hours=6),
        )
        session.add(transaction)
    
    # 2. Create Sales Orders to consume all PO inventory
    # Distribute PO quantities across 2-4 sales orders
    num_sales_orders = random.randint(2, 4)
    sales_orders_data = []
    
    # Track remaining quantities per product
    remaining_quantities = {line["product_id"]: line["quantity"] for line in po_lines}
    
    for so_num in range(num_sales_orders):
        customer = random.choice(customers)
        # Sales order date: spread across the week after PO receipt
        so_date = po_date + timedelta(days=random.randint(1, 5), hours=random.randint(9, 17))
        
        # Select products for this SO (from PO products)
        so_products = random.sample(po_products, min(random.randint(1, len(po_products)), len(po_products)))
        
        so_lines = []
        for product in so_products:
            if remaining_quantities[product.id] <= 0:
                continue  # Skip if already allocated
            
            # Allocate some or all remaining quantity
            if so_num == num_sales_orders - 1:
                # Last SO gets all remaining
                quantity = remaining_quantities[product.id]
            else:
                # Distribute quantity across SOs
                max_qty = remaining_quantities[product.id]
                quantity = random.randint(1, max(1, max_qty // 2))
            
            quantity = min(quantity, remaining_quantities[product.id])
            remaining_quantities[product.id] -= quantity
            
            unit_price = product.unit_price  # Use product's standard price
            so_lines.append({
                "product_id": product.id,
                "quantity": quantity,
                "unit_price": unit_price,
            })
        
        if not so_lines:
            continue  # Skip if no lines
        
        # Create Sales Order
        sales_order = SalesOrder(
            customer_id=customer.id,
            status="shipped",  # Will be fully processed
            order_date=so_date,
            shipped_date=so_date + timedelta(days=random.randint(1, 3)),
            created_by_user_id=user.id,
        )
        session.add(sales_order)
        session.flush()
        
        # Create SO lines
        for line_data in so_lines:
            so_line = SalesOrderLine(
                sales_order_id=sales_order.id,
                **line_data
            )
            session.add(so_line)
        session.flush()
        
        # Apply allocation (increase allocated)
        for line_data in so_lines:
            item = session.get(InventoryItem, line_data["product_id"])
            item.allocated += line_data["quantity"]
            
            transaction = InventoryTransaction(
                product_id=line_data["product_id"],
                quantity_delta=-line_data["quantity"],
                reference=f"SO:{sales_order.id}",
                type="sales_allocation",
                created_at=so_date,
            )
            session.add(transaction)
        
        # Apply shipment (decrease allocated and on_hand)
        ship_date = sales_order.shipped_date
        for line_data in so_lines:
            item = session.get(InventoryItem, line_data["product_id"])
            item.allocated -= line_data["quantity"]
            item.on_hand -= line_data["quantity"]
            
            transaction = InventoryTransaction(
                product_id=line_data["product_id"],
                quantity_delta=-line_data["quantity"],
                reference=f"SO:{sales_order.id}",
                type="sales_shipment",
                created_at=ship_date,
            )
            session.add(transaction)
    
    session.commit()


def create_current_sales_orders_and_low_stock(
    session: Session,
    products: List[Product],
    customers: List[Customer],
    user: User,
) -> None:
    """Create current sales orders (not yet shipped) and low stock items."""
    print("\nCreating current sales orders and low stock items...")
    
    today = datetime.now(timezone.utc)
    
    # 1. Create some low stock items (available < 10)
    # Select 3-5 random products to have low stock
    low_stock_products = random.sample(products, min(random.randint(3, 5), len(products)))
    
    for product in low_stock_products:
        item = session.get(InventoryItem, product.id)
        if not item:
            item = InventoryItem(product_id=product.id, on_hand=0, allocated=0)
            session.add(item)
            session.flush()
        
        # Set low stock: on_hand between 5-15, allocated between 0-5
        # This makes available between 0-15 (some will be < 10)
        on_hand = random.randint(5, 15)
        allocated = random.randint(0, min(5, on_hand))
        
        # If we need to adjust existing inventory
        if item.on_hand > 0:
            # Reduce to low stock levels
            adjustment = on_hand - item.on_hand
            item.on_hand = on_hand
            item.allocated = allocated
            
            # Create adjustment transaction
            transaction = InventoryTransaction(
                product_id=product.id,
                quantity_delta=adjustment,
                reference="Low stock seed",
                type="manual_adjustment",
                created_at=today - timedelta(days=random.randint(1, 7)),
            )
            session.add(transaction)
        else:
            # Set initial low stock
            item.on_hand = on_hand
            item.allocated = allocated
            
            # Create initial inventory transaction
            transaction = InventoryTransaction(
                product_id=product.id,
                quantity_delta=on_hand,
                reference="Initial low stock",
                type="manual_adjustment",
                created_at=today - timedelta(days=random.randint(1, 7)),
            )
            session.add(transaction)
    
    session.flush()
    
    # 2. Create current sales orders (not yet shipped)
    # Create 2-3 "created" status orders (not yet allocated)
    num_created_orders = random.randint(2, 3)
    for i in range(num_created_orders):
        customer = random.choice(customers)
        order_date = today - timedelta(days=random.randint(1, 5))
        
        # Select 1-2 products for this order
        so_products = random.sample(products, min(random.randint(1, 2), len(products)))
        
        so_lines = []
        for product in so_products:
            # Order quantity that might exceed available (to show allocation issues)
            quantity = random.randint(10, 30)
            unit_price = product.unit_price
            so_lines.append({
                "product_id": product.id,
                "quantity": quantity,
                "unit_price": unit_price,
            })
        
        # Create Sales Order with "created" status
        sales_order = SalesOrder(
            customer_id=customer.id,
            status="created",
            order_date=order_date,
            shipped_date=None,
            created_by_user_id=user.id,
        )
        session.add(sales_order)
        session.flush()
        
        # Create SO lines
        for line_data in so_lines:
            so_line = SalesOrderLine(
                sales_order_id=sales_order.id,
                **line_data
            )
            session.add(so_line)
        
        print(f"  Created sales order #{sales_order.id} (status: created)")
    
    # Create 2-3 "allocated" status orders (ready to be picked)
    num_allocated_orders = random.randint(2, 3)
    for i in range(num_allocated_orders):
        customer = random.choice(customers)
        order_date = today - timedelta(days=random.randint(1, 3))
        
        # Select 1-2 products for this order
        so_products = random.sample(products, min(random.randint(1, 2), len(products)))
        
        so_lines = []
        for product in so_products:
            # Order quantity that fits available inventory
            item = session.get(InventoryItem, product.id)
            available = (item.on_hand - item.allocated) if item else 0
            quantity = random.randint(5, min(20, max(1, available // 2))) if available > 0 else random.randint(5, 15)
            unit_price = product.unit_price
            so_lines.append({
                "product_id": product.id,
                "quantity": quantity,
                "unit_price": unit_price,
            })
        
        # Create Sales Order with "allocated" status
        sales_order = SalesOrder(
            customer_id=customer.id,
            status="allocated",
            order_date=order_date,
            shipped_date=None,
            created_by_user_id=user.id,
        )
        session.add(sales_order)
        session.flush()
        
        # Create SO lines
        for line_data in so_lines:
            so_line = SalesOrderLine(
                sales_order_id=sales_order.id,
                **line_data
            )
            session.add(so_line)
        
        # Apply allocation (increase allocated)
        for line_data in so_lines:
            item = session.get(InventoryItem, line_data["product_id"])
            if not item:
                item = InventoryItem(product_id=line_data["product_id"], on_hand=0, allocated=0)
                session.add(item)
                session.flush()
            
            # Ensure we have enough on_hand
            if item.on_hand < line_data["quantity"]:
                item.on_hand = line_data["quantity"] + random.randint(0, 10)
            
            item.allocated += line_data["quantity"]
            
            transaction = InventoryTransaction(
                product_id=line_data["product_id"],
                quantity_delta=-line_data["quantity"],
                reference=f"SO:{sales_order.id}",
                type="sales_allocation",
                created_at=order_date,
            )
            session.add(transaction)
        
        print(f"  Created sales order #{sales_order.id} (status: allocated)")
    
    session.commit()
    print("✓ Current sales orders and low stock items created")


def seed_historical_data(num_weeks: int = 52) -> None:
    """Seed historical data for specified number of weeks.
    
    Args:
        num_weeks: Number of weeks of data to create (default: 52)
    """
    print("Starting historical data seeding...")
    
    with Session(engine) as session:
        # Get or create required entities
        print("Getting or creating entities...")
        products, suppliers, customers, user = get_or_create_entities(session)
        
        print(f"Found {len(products)} products, {len(suppliers)} suppliers, {len(customers)} customers")
        
        # Check if data already exists
        existing_po = session.exec(select(PurchaseOrder).limit(1)).first()
        if existing_po:
            response = input("Purchase orders already exist. Continue anyway? (y/n): ")
            if response.lower() != 'y':
                print("Seeding cancelled.")
                return
        
        # Calculate date range
        today = datetime.now(timezone.utc)
        
        print(f"Creating {num_weeks} weeks of historical data...")
        print("This may take a few minutes...")
        
        # Create data for each week
        for week_num in range(num_weeks):
            # Calculate week start: go back (num_weeks - week_num) weeks from today
            # Each week starts on Monday
            weeks_ago = num_weeks - week_num - 1
            target_date = today - timedelta(weeks=weeks_ago)
            
            # Find the Monday of that week
            days_since_monday = target_date.weekday()  # 0 = Monday, 6 = Sunday
            week_start = (target_date - timedelta(days=days_since_monday)).replace(
                hour=8, minute=0, second=0, microsecond=0
            )
            
            try:
                create_weekly_data(session, week_start, products, suppliers, customers, user)
                if (week_num + 1) % 10 == 0:
                    print(f"  Completed {week_num + 1}/{num_weeks} weeks...")
            except Exception as e:
                print(f"Error creating week {week_num + 1}: {e}")
                session.rollback()
                raise
        
        # Count created records
        po_count = len(session.exec(select(PurchaseOrder)).all())
        so_count = len(session.exec(select(SalesOrder)).all())
        inv_count = len(session.exec(select(InventoryItem)).all())
        trans_count = len(session.exec(select(InventoryTransaction)).all())
        
        # Create current sales orders and low stock items
        create_current_sales_orders_and_low_stock(session, products, customers, user)
        
        # Count created records
        po_count = len(session.exec(select(PurchaseOrder)).all())
        so_count = len(session.exec(select(SalesOrder)).all())
        inv_count = len(session.exec(select(InventoryItem)).all())
        trans_count = len(session.exec(select(InventoryTransaction)).all())
        
        # Count current/pending orders
        created_so_count = len(session.exec(select(SalesOrder).where(SalesOrder.status == "created")).all())
        allocated_so_count = len(session.exec(select(SalesOrder).where(SalesOrder.status == "allocated")).all())
        
        # Count low stock items (available < 10)
        low_stock_count = 0
        all_items = session.exec(select(InventoryItem)).all()
        for item in all_items:
            if (item.on_hand - item.allocated) < 10:
                low_stock_count += 1
        
        print(f"\n✓ Successfully created {num_weeks} weeks of historical data!")
        print(f"  - Purchase Orders: {po_count}")
        print(f"  - Sales Orders: {so_count}")
        print(f"    * Created (pending): {created_so_count}")
        print(f"    * Allocated (ready to ship): {allocated_so_count}")
        print(f"  - Inventory Items: {inv_count}")
        print(f"    * Low stock items (< 10 available): {low_stock_count}")
        print(f"  - Transactions: {trans_count}")


if __name__ == "__main__":
    import sys
    
    # Allow specifying number of weeks as argument
    weeks = 52
    if len(sys.argv) > 1:
        try:
            weeks = int(sys.argv[1])
            if weeks < 1 or weeks > 104:
                print("Warning: Number of weeks should be between 1 and 104. Using 52.")
                weeks = 52
        except ValueError:
            print("Invalid number of weeks. Using default: 52")
    
    seed_historical_data(weeks)

