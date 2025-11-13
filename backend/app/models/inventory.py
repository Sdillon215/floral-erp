from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class InventoryItem(SQLModel, table=True):
    product_id: int = Field(primary_key=True, foreign_key="product.id")
    on_hand: int = Field(default=0, ge=0)
    allocated: int = Field(default=0, ge=0)

    transactions: list["InventoryTransaction"] = Relationship(back_populates="inventory_item")

    @property
    def available(self) -> int:
        return self.on_hand - self.allocated


class InventoryTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="inventoryitem.product_id")
    quantity_delta: int
    reference: Optional[str] = Field(default=None, max_length=100)
    type: str = Field(default="purchase_receipt", max_length=50)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    inventory_item: Optional[InventoryItem] = Relationship(back_populates="transactions")
