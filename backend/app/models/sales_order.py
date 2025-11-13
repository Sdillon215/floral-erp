from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class SalesOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    status: str = Field(default="created", max_length=50)
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    shipped_date: Optional[datetime] = None
    created_by_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_by_customer_id: Optional[int] = Field(default=None, foreign_key="customer.id")

    lines: list["SalesOrderLine"] = Relationship(back_populates="sales_order")


class SalesOrderLine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sales_order_id: int = Field(foreign_key="salesorder.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)

    sales_order: Optional[SalesOrder] = Relationship(back_populates="lines")
