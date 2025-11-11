from typing import Optional

from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sku: str = Field(index=True, unique=True, max_length=64)
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None)
    unit_price: float = Field(default=0.0, ge=0)
    unit_of_measure: str = Field(default="each", max_length=50)
    is_active: bool = Field(default=True)

