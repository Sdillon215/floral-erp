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
    InventoryTransactionOut,
)

router = APIRouter()


@router.get("/", response_model=List[InventoryItemOut], dependencies=[Depends(require_roles(UserRole.BUYER, UserRole.SALES))])
def list_inventory(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    items = db.exec(select(InventoryItem).offset(skip).limit(limit)).all()
    return items


@router.get("/{product_id}", response_model=InventoryItemOut, dependencies=[Depends(require_roles(UserRole.BUYER, UserRole.SALES))])
def get_inventory_item(product_id: int, db: Session = Depends(get_session)):
    item = db.get(InventoryItem, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


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


@router.get("/{product_id}/transactions", response_model=List[InventoryTransactionOut], dependencies=[Depends(require_roles(UserRole.BUYER, UserRole.SALES))])
def get_inventory_transactions(
    product_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session),
):
    # Verify product exists
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    transactions = db.exec(
        select(InventoryTransaction)
        .where(InventoryTransaction.product_id == product_id)
        .order_by(InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    
    return transactions
