from datetime import datetime

from datetime import timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class PurchaseOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    status: str = Field(default="created", max_length=50)
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    received_date: Optional[datetime] = None

    lines: list["PurchaseOrderLine"] = Relationship(back_populates="purchase_order")


class PurchaseOrderLine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_order_id: int = Field(foreign_key="purchaseorder.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int = Field(gt=0)
    unit_cost: Optional[float] = Field(default=None, ge=0)

    purchase_order: Optional[PurchaseOrder] = Relationship(back_populates="lines")
