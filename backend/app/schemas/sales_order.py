from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SalesOrderLineBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)


class SalesOrderLineCreate(SalesOrderLineBase):
    pass


class SalesOrderLineOut(SalesOrderLineBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SalesOrderBase(BaseModel):
    customer_id: int
    status: str = Field(default="created")
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    shipped_date: Optional[datetime] = None
    created_by_user_id: Optional[int] = None
    created_by_customer_id: Optional[int] = None


class SalesOrderCreate(SalesOrderBase):
    lines: List[SalesOrderLineCreate]


class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    shipped_date: Optional[datetime] = None


class SalesOrderOut(SalesOrderBase):
    id: int
    lines: List[SalesOrderLineOut]

    model_config = ConfigDict(from_attributes=True)
