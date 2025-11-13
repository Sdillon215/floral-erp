from datetime import datetime
from datetime import timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.purchase_order import PurchaseOrder


class PurchaseOrderLineBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: Optional[float] = Field(default=None, ge=0)


class PurchaseOrderLineCreate(PurchaseOrderLineBase):
    pass


class PurchaseOrderLineOut(PurchaseOrderLineBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    status: str = Field(default="created")
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    received_date: Optional[datetime] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    lines: List[PurchaseOrderLineCreate]


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    received_date: Optional[datetime] = None


class PurchaseOrderOut(PurchaseOrderBase):
    id: int
    lines: List[PurchaseOrderLineOut]

    model_config = ConfigDict(from_attributes=True)
