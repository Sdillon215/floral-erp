from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InventoryItemOut(BaseModel):
    product_id: int
    on_hand: int
    allocated: int
    available: int

    model_config = ConfigDict(from_attributes=True)


class InventoryAdjustmentCreate(BaseModel):
    product_id: int
    quantity_delta: int
    reference: Optional[str] = None


class InventoryTransactionOut(BaseModel):
    id: int
    product_id: int
    quantity_delta: int
    reference: Optional[str]
    type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryAdjustmentOut(BaseModel):
    item: InventoryItemOut
    transaction: InventoryTransactionOut
