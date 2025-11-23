from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.core.dependencies import require_roles
from app.db.session import get_session
from app.models.customer import Customer
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.product import Product
from app.models.sales_order import SalesOrder, SalesOrderLine
from app.models.user import UserRole
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderOut,
    SalesOrderUpdate,
)

router = APIRouter()


def _ensure_customer_exists(db: Session, customer_id: int) -> None:
    if not db.get(Customer, customer_id):
        raise HTTPException(status_code=400, detail="Customer not found")


def _ensure_products_exist(db: Session, line_inputs: List[SalesOrderLine]) -> None:
    for line in line_inputs:
        if not db.get(Product, line.product_id):
            raise HTTPException(status_code=400, detail=f"Product {line.product_id} not found")


def _create_sales_order_lines(line_inputs: List[SalesOrderLine]) -> List[SalesOrderLine]:
    return [SalesOrderLine(product_id=line.product_id, quantity=line.quantity, unit_price=line.unit_price) for line in line_inputs]


def _apply_allocation(db: Session, sales_order: SalesOrder) -> None:
    for line in sales_order.lines:
        item = db.get(InventoryItem, line.product_id)
        if not item or item.available < line.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient inventory for product {line.product_id}")
        item.allocated += line.quantity
        transaction = InventoryTransaction(
            product_id=line.product_id,
            quantity_delta=-line.quantity,
            reference=f"SO:{sales_order.id}",
            type="sales_allocation",
        )
        db.add(transaction)


def _apply_shipment(db: Session, sales_order: SalesOrder) -> None:
    for line in sales_order.lines:
        item = db.get(InventoryItem, line.product_id)
        if not item or item.allocated < line.quantity:
            raise HTTPException(status_code=400, detail=f"Cannot ship product {line.product_id} without allocation")
        item.allocated -= line.quantity
        if item.on_hand < line.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient on hand inventory for product {line.product_id}")
        item.on_hand -= line.quantity
        transaction = InventoryTransaction(
            product_id=line.product_id,
            quantity_delta=-line.quantity,
            reference=f"SO:{sales_order.id}",
            type="sales_shipment",
        )
        db.add(transaction)


@router.post("/", response_model=SalesOrderOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(UserRole.SALES))])
def create_sales_order(
    sales_order_in: SalesOrderCreate,
    db: Session = Depends(get_session),
):
    _ensure_customer_exists(db, sales_order_in.customer_id)

    line_models = [SalesOrderLine(**line.model_dump()) for line in sales_order_in.lines]
    _ensure_products_exist(db, line_models)

    sales_order = SalesOrder(
        customer_id=sales_order_in.customer_id,
        status=sales_order_in.status,
        order_date=sales_order_in.order_date,
        shipped_date=sales_order_in.shipped_date,
        created_by_user_id=sales_order_in.created_by_user_id,
        created_by_customer_id=sales_order_in.created_by_customer_id,
        lines=line_models,
    )

    db.add(sales_order)
    db.commit()
    db.refresh(sales_order)
    return sales_order


@router.get("/", response_model=List[SalesOrderOut], dependencies=[Depends(require_roles(UserRole.SALES, UserRole.PICKER_PACKER))])
def list_sales_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return db.exec(
        select(SalesOrder)
        .order_by(SalesOrder.order_date.desc(), SalesOrder.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()


@router.get("/{sales_order_id}", response_model=SalesOrderOut, dependencies=[Depends(require_roles(UserRole.SALES, UserRole.PICKER_PACKER))])
def get_sales_order(sales_order_id: int, db: Session = Depends(get_session)):
    sales_order = db.exec(select(SalesOrder).where(SalesOrder.id == sales_order_id)).first()
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return sales_order


@router.post("/{sales_order_id}/allocate", response_model=SalesOrderOut, dependencies=[Depends(require_roles(UserRole.SALES))])
def allocate_sales_order(sales_order_id: int, db: Session = Depends(get_session)):
    sales_order = db.get(SalesOrder, sales_order_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if sales_order.status != "created":
        raise HTTPException(status_code=400, detail="Only created orders can be allocated")

    _apply_allocation(db, sales_order)
    sales_order.status = "allocated"

    db.add(sales_order)
    db.commit()
    db.refresh(sales_order)
    return sales_order


@router.post("/{sales_order_id}/ship", response_model=SalesOrderOut, dependencies=[Depends(require_roles(UserRole.PICKER_PACKER))])
def ship_sales_order(sales_order_id: int, db: Session = Depends(get_session)):
    sales_order = db.get(SalesOrder, sales_order_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if sales_order.status != "allocated":
        raise HTTPException(status_code=400, detail="Only allocated orders can be shipped")

    _apply_shipment(db, sales_order)
    sales_order.status = "shipped"
    if not sales_order.shipped_date:
        sales_order.shipped_date = datetime.now(timezone.utc)

    db.add(sales_order)
    db.commit()
    db.refresh(sales_order)
    return sales_order


@router.put("/{sales_order_id}", response_model=SalesOrderOut, dependencies=[Depends(require_roles(UserRole.SALES))])
def update_sales_order(
    sales_order_id: int,
    sales_order_update: SalesOrderUpdate,
    db: Session = Depends(get_session),
):
    sales_order = db.get(SalesOrder, sales_order_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    
    # Only allow updating orders that are in "created" status
    if sales_order.status != "created":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update sales order with status '{sales_order.status}'. Only 'created' orders can be updated."
        )

    update_data = sales_order_update.model_dump(exclude_unset=True)
    
    # Don't allow status changes through UPDATE - use dedicated endpoints
    if "status" in update_data:
        raise HTTPException(
            status_code=400,
            detail="Cannot update status directly. Use /allocate or /ship endpoints to change status."
        )

    # Handle line items update
    if "lines" in update_data and update_data["lines"] is not None:
        # Delete existing lines
        existing_lines = db.exec(
            select(SalesOrderLine).where(SalesOrderLine.sales_order_id == sales_order.id)
        ).all()
        for line in existing_lines:
            db.delete(line)
        db.flush()  # Ensure old lines are deleted before adding new ones

        # Add new lines
        new_lines = []
        for line_in in update_data["lines"]:
            product = db.get(Product, line_in["product_id"])
            if not product:
                raise HTTPException(status_code=400, detail=f"Product {line_in['product_id']} not found")
            new_lines.append(SalesOrderLine(**line_in))
        sales_order.lines = new_lines
        del update_data["lines"]  # Remove lines from update_data to prevent direct setattr

    for field, value in update_data.items():
        setattr(sales_order, field, value)

    db.add(sales_order)
    db.commit()
    db.refresh(sales_order)
    return sales_order


@router.delete("/{sales_order_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(UserRole.SALES))])
def delete_sales_order(sales_order_id: int, db: Session = Depends(get_session)):
    sales_order = db.get(SalesOrder, sales_order_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    
    # Only allow deleting orders that are in "created" status
    if sales_order.status != "created":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete sales order with status '{sales_order.status}'. Only 'created' orders can be deleted."
        )

    db.delete(sales_order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
