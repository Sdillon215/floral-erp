from typing import Optional

from sqlmodel import Field, SQLModel


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=255)
    email: str = Field(index=True, unique=True, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    billing_address: Optional[str] = Field(default=None)
    shipping_address: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)

