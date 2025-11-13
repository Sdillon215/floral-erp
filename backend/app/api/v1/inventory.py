from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_admin, require_roles
from app.db.session import get_session
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.product import Product
from app.models.user import UserRole
from app.schemas.inventory import (
    InventoryAdjustmentCreate,
    InventoryAdjustmentOut,
    InventoryItemOut,
)

router = APIRouter()


@router.get("/", response_model=List[InventoryItemOut], dependencies=[Depends(require_roles(UserRole.BUYER, UserRole.SALES))])
def list_inventory(db: Session = Depends(get_session)):
    items = db.exec(select(InventoryItem)).all()
    return items


@router.post("/adjust", response_model=InventoryAdjustmentOut, dependencies=[Depends(get_current_admin)])
def adjust_inventory(adjustment: InventoryAdjustmentCreate, db: Session = Depends(get_session)):
    product = db.get(Product, adjustment.product_id)
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")

    item = db.get(InventoryItem, adjustment.product_id)
    if not item:
        if adjustment.quantity_delta < 0:
            raise HTTPException(status_code=400, detail="Cannot reduce inventory below zero")
        item = InventoryItem(product_id=adjustment.product_id, on_hand=0, allocated=0)
        db.add(item)
        db.commit()
        db.refresh(item)

    new_on_hand = item.on_hand + adjustment.quantity_delta
    if new_on_hand < 0:
        raise HTTPException(status_code=400, detail="Inventory quantity cannot be negative")

    item.on_hand = new_on_hand
    transaction = InventoryTransaction(
        product_id=adjustment.product_id,
        quantity_delta=adjustment.quantity_delta,
        reference=adjustment.reference,
        type="manual_adjustment",
    )

    db.add(item)
    db.add(transaction)
    db.commit()
    db.refresh(item)
    db.refresh(transaction)

    return InventoryAdjustmentOut(item=item, transaction=transaction)
