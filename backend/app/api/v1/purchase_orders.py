from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.core.dependencies import require_roles
from app.db.session import get_session
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.models.supplier import Supplier
from app.models.user import UserRole
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderOut,
    PurchaseOrderUpdate,
)

router = APIRouter(dependencies=[Depends(require_roles(UserRole.BUYER))])


def _apply_purchase_order_receipt(db: Session, purchase_order: PurchaseOrder) -> None:
    lines = db.exec(
        select(PurchaseOrderLine).where(PurchaseOrderLine.purchase_order_id == purchase_order.id)
    ).all()
    for line in lines:
        item = db.get(InventoryItem, line.product_id)
        if not item:
            item = InventoryItem(product_id=line.product_id, on_hand=0, allocated=0)
            db.add(item)
            db.flush()
        item.on_hand += line.quantity
        transaction = InventoryTransaction(
            product_id=line.product_id,
            quantity_delta=line.quantity,
            reference=f"PO:{purchase_order.id}",
            type="purchase_receipt",
        )
        db.add(transaction)


@router.post("/", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    purchase_order_in: PurchaseOrderCreate,
    db: Session = Depends(get_session),
):
    supplier = db.get(Supplier, purchase_order_in.supplier_id)
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")

    lines: list[PurchaseOrderLine] = []
    for line_in in purchase_order_in.lines:
        product = db.get(Product, line_in.product_id)
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {line_in.product_id} not found")
        lines.append(PurchaseOrderLine(**line_in.model_dump()))

    purchase_order = PurchaseOrder(
        supplier_id=purchase_order_in.supplier_id,
        status=purchase_order_in.status,
        order_date=purchase_order_in.order_date,
        received_date=purchase_order_in.received_date,
        lines=lines,
    )

    db.add(purchase_order)
    db.commit()
    db.refresh(purchase_order)

    if purchase_order.status == "received":
        _apply_purchase_order_receipt(db, purchase_order)
        if not purchase_order.received_date:
            purchase_order.received_date = datetime.now(timezone.utc)
        db.add(purchase_order)
        db.commit()
        db.refresh(purchase_order)

    return purchase_order


@router.get("/", response_model=List[PurchaseOrderOut])
def list_purchase_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    purchase_orders = db.exec(select(PurchaseOrder).offset(skip).limit(limit)).all()
    return purchase_orders


@router.get("/{purchase_order_id}", response_model=PurchaseOrderOut)
def get_purchase_order(purchase_order_id: int, db: Session = Depends(get_session)):
    purchase_order = db.exec(
        select(PurchaseOrder).where(PurchaseOrder.id == purchase_order_id)
    ).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return purchase_order


@router.put("/{purchase_order_id}", response_model=PurchaseOrderOut)
def update_purchase_order(
    purchase_order_id: int,
    purchase_order_update: PurchaseOrderUpdate,
    db: Session = Depends(get_session),
):
    purchase_order = db.get(PurchaseOrder, purchase_order_id)
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    previous_status = purchase_order.status
    update_data = purchase_order_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in {"created", "received"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    for field, value in update_data.items():
        setattr(purchase_order, field, value)

    if purchase_order.status == "received" and previous_status != "received":
        if not purchase_order.received_date:
            purchase_order.received_date = datetime.now(timezone.utc)
        _apply_purchase_order_receipt(db, purchase_order)

    db.add(purchase_order)
    db.commit()
    db.refresh(purchase_order)
    return purchase_order


@router.delete("/{purchase_order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_order(purchase_order_id: int, db: Session = Depends(get_session)):
    purchase_order = db.get(PurchaseOrder, purchase_order_id)
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Only allow deleting orders that are in "created" status
    # Cannot delete received orders as they have already affected inventory
    if purchase_order.status != "created":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete purchase order with status '{purchase_order.status}'. Only 'created' orders can be deleted."
        )

    db.delete(purchase_order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
