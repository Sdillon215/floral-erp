from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import require_roles
from app.db.session import get_session
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
    return purchase_order


@router.get("/", response_model=List[PurchaseOrderOut])
def list_purchase_orders(db: Session = Depends(get_session)):
    purchase_orders = db.exec(select(PurchaseOrder)).all()
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

    update_data = purchase_order_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in {"created", "received"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    for field, value in update_data.items():
        setattr(purchase_order, field, value)

    db.add(purchase_order)
    db.commit()
    db.refresh(purchase_order)
    return purchase_order
